/**
 * D&D 5E Data Transformation Script
 * 
 * Transforms raw 5etools JSON files into optimized format for the app.
 * 
 * Usage: node tools/build-data.js
 * 
 * Input:  data-source/*.json
 * Output: public/data/*.json
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.join(__dirname, '..', 'data-source');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate a unique key for an entity: "name|source" in lowercase
 */
function makeKey(name, source) {
  return `${name}|${source}`.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Read and parse a JSON file
 */
function readJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Write JSON to file with pretty formatting
 */
function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  const stats = fs.statSync(filePath);
  console.log(`  Written: ${path.basename(filePath)} (${(stats.size / 1024).toFixed(1)} KB)`);
}

/**
 * Calculate MD5 hash of file contents
 */
function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Clean 5etools text formatting tags like {@damage 1d6} -> "1d6"
 */
function cleanText(text) {
  if (typeof text !== 'string') return text;
  
  // Remove 5etools tags: {@tag content} or {@tag content|source} -> content
  return text
    .replace(/\{@\w+\s+([^|}]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@\w+\s+([^}]+)\}/g, '$1');
}

/**
 * Recursively clean all string values in an object
 */
function cleanObject(obj) {
  if (typeof obj === 'string') {
    return cleanText(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  }
  if (obj && typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = cleanObject(value);
    }
    return cleaned;
  }
  return obj;
}

/**
 * Extract entries (traits/features) into a simpler format
 */
function extractEntries(entries) {
  if (!entries) return [];
  
  return entries.map(entry => {
    if (typeof entry === 'string') {
      return { text: cleanText(entry) };
    }
    if (entry.type === 'entries' && entry.name) {
      return {
        name: entry.name,
        text: entry.entries ? entry.entries.map(e => 
          typeof e === 'string' ? cleanText(e) : cleanObject(e)
        ) : []
      };
    }
    if (entry.type === 'list') {
      return {
        type: 'list',
        items: entry.items ? entry.items.map(cleanObject) : []
      };
    }
    return cleanObject(entry);
  });
}

// =============================================================================
// TRANSFORMERS
// =============================================================================

/**
 * Transform races
 */
function transformRaces() {
  console.log('\nTransforming races...');
  const source = readJson(path.join(SOURCE_DIR, 'races.json'));
  if (!source || !source.race) return {};
  
  const output = {};
  
  for (const race of source.race) {
    const key = makeKey(race.name, race.source);
    
    // Extract ability bonuses
    let abilityBonuses = {};
    if (race.ability && race.ability[0]) {
      const ab = race.ability[0];
      if (ab.choose) {
        // "Choose any" style bonuses - store the choice info
        abilityBonuses = { choose: ab.choose };
      } else {
        abilityBonuses = { ...ab };
      }
    }
    
    // Normalize speed
    let speed = 30;
    if (typeof race.speed === 'number') {
      speed = race.speed;
    } else if (race.speed && typeof race.speed === 'object') {
      speed = race.speed;
    }
    
    // Extract size (convert array to single value)
    const size = Array.isArray(race.size) ? race.size[0] : race.size || 'M';
    
    // Extract language proficiencies
    const languages = [];
    if (race.languageProficiencies && race.languageProficiencies[0]) {
      const lp = race.languageProficiencies[0];
      for (const [lang, value] of Object.entries(lp)) {
        if (value === true) {
          languages.push(lang);
        } else if (lang === 'anyStandard' && typeof value === 'number') {
          languages.push({ choose: { from: 'standard', count: value } });
        } else if (lang === 'any' && typeof value === 'number') {
          languages.push({ choose: { from: 'any', count: value } });
        }
      }
    }
    
    // Extract skill proficiencies
    const skillProficiencies = [];
    if (race.skillProficiencies && race.skillProficiencies[0]) {
      const sp = race.skillProficiencies[0];
      for (const [skill, value] of Object.entries(sp)) {
        if (value === true) {
          skillProficiencies.push(skill);
        } else if (skill === 'choose') {
          skillProficiencies.push({ choose: value });
        }
      }
    }
    
    // Extract darkvision and other senses
    const senses = {};
    if (race.darkvision) {
      senses.darkvision = race.darkvision;
    }
    
    // Extract traits
    const traits = extractEntries(race.entries);
    
    output[key] = {
      key,
      name: race.name,
      source: race.source,
      page: race.page,
      size,
      speed,
      abilityBonuses,
      languages,
      skillProficiencies,
      senses,
      traits,
      // Preserve some useful flags
      srd: race.srd || false,
      basicRules: race.basicRules || false,
    };
    
    // Handle subraces if present
    if (race.subraces) {
      output[key].subraces = race.subraces.map(subrace => ({
        key: makeKey(subrace.name, subrace.source || race.source),
        name: subrace.name,
        source: subrace.source || race.source,
        abilityBonuses: subrace.ability && subrace.ability[0] ? subrace.ability[0] : {},
        traits: extractEntries(subrace.entries),
      }));
    }
  }
  
  console.log(`  Processed ${Object.keys(output).length} races`);
  return output;
}

/**
 * Transform classes
 */
function transformClasses() {
  console.log('\nTransforming classes...');
  const classDir = path.join(SOURCE_DIR, 'class');
  const output = {};
  
  // Read all class-*.json files
  const classFiles = fs.readdirSync(classDir)
    .filter(f => f.startsWith('class-') && f.endsWith('.json'));
  
  for (const file of classFiles) {
    const source = readJson(path.join(classDir, file));
    if (!source || !source.class) continue;
    
    for (const cls of source.class) {
      const key = makeKey(cls.name, cls.source);
      
      // Extract hit die
      const hitDie = cls.hd ? cls.hd.faces : 8;
      
      // Extract saving throw proficiencies
      const savingThrows = cls.proficiency || [];
      
      // Extract starting proficiencies
      const startingProficiencies = {
        armor: cls.startingProficiencies?.armor || [],
        weapons: cls.startingProficiencies?.weapons || [],
        tools: cls.startingProficiencies?.tools || [],
        skills: cls.startingProficiencies?.skills || [],
      };
      
      // Extract class features as references
      const classFeatures = [];
      if (cls.classFeatures) {
        for (const feature of cls.classFeatures) {
          if (typeof feature === 'string') {
            // Format: "Feature Name|Class|Subclass|Level"
            const parts = feature.split('|');
            classFeatures.push({
              name: parts[0],
              className: parts[1],
              level: parseInt(parts[3]) || 1,
              source: parts[4] || cls.source,
            });
          } else if (feature.classFeature) {
            const parts = feature.classFeature.split('|');
            classFeatures.push({
              name: parts[0],
              className: parts[1],
              level: parseInt(parts[3]) || 1,
              source: parts[4] || cls.source,
              gainSubclassFeature: feature.gainSubclassFeature || false,
            });
          }
        }
      }
      
      // Extract spellcasting info if present
      let spellcasting = null;
      if (cls.spellcastingAbility) {
        spellcasting = {
          ability: cls.spellcastingAbility,
          casterType: cls.casterProgression || null,
          cantripsKnown: cls.cantripProgression || null,
          spellsKnown: cls.spellsKnownProgression || null,
          spellsKnownProgressionFixedByLevel: cls.spellsKnownProgressionFixedByLevel || null,
        };
      }
      
      // Extract multiclassing requirements
      const multiclassing = cls.multiclassing ? {
        requirements: cls.multiclassing.requirements || null,
        proficienciesGained: cls.multiclassing.proficienciesGained || null,
      } : null;
      
      // Subclass feature level
      const subclassTitle = cls.subclassTitle || 'Subclass';
      let subclassLevel = 3; // default
      const subclassFeature = classFeatures.find(f => f.gainSubclassFeature);
      if (subclassFeature) {
        subclassLevel = subclassFeature.level;
      }
      
      output[key] = {
        key,
        name: cls.name,
        source: cls.source,
        page: cls.page,
        hitDie,
        savingThrows,
        startingProficiencies,
        classFeatures,
        spellcasting,
        multiclassing,
        subclassTitle,
        subclassLevel,
        srd: cls.srd || false,
        basicRules: cls.basicRules || false,
      };
    }
    
    // Also extract subclasses from the same file
    if (source.subclass) {
      for (const subclass of source.subclass) {
        const parentKey = makeKey(subclass.className, subclass.classSource);
        if (output[parentKey]) {
          if (!output[parentKey].subclasses) {
            output[parentKey].subclasses = [];
          }
          
          output[parentKey].subclasses.push({
            key: makeKey(subclass.name, subclass.source),
            name: subclass.name,
            shortName: subclass.shortName || subclass.name,
            source: subclass.source,
            // Features are referenced, not embedded for now
            subclassFeatures: (subclass.subclassFeatures || []).map(f => {
              if (typeof f === 'string') {
                const parts = f.split('|');
                return {
                  name: parts[0],
                  level: parseInt(parts[4]) || 1,
                };
              }
              return f;
            }),
          });
        }
      }
    }
  }
  
  console.log(`  Processed ${Object.keys(output).length} classes`);
  return output;
}

/**
 * Transform backgrounds
 */
function transformBackgrounds() {
  console.log('\nTransforming backgrounds...');
  const source = readJson(path.join(SOURCE_DIR, 'backgrounds.json'));
  if (!source || !source.background) return {};
  
  const output = {};
  
  for (const bg of source.background) {
    const key = makeKey(bg.name, bg.source);
    
    // Extract skill proficiencies
    const skillProficiencies = [];
    if (bg.skillProficiencies && bg.skillProficiencies[0]) {
      const sp = bg.skillProficiencies[0];
      for (const [skill, value] of Object.entries(sp)) {
        if (value === true) {
          skillProficiencies.push(skill);
        } else if (skill === 'choose') {
          skillProficiencies.push({ choose: value });
        }
      }
    }
    
    // Extract tool proficiencies
    const toolProficiencies = [];
    if (bg.toolProficiencies && bg.toolProficiencies[0]) {
      const tp = bg.toolProficiencies[0];
      for (const [tool, value] of Object.entries(tp)) {
        if (value === true) {
          toolProficiencies.push(tool);
        } else if (typeof value === 'number') {
          toolProficiencies.push({ choose: { from: tool, count: value } });
        }
      }
    }
    
    // Extract language proficiencies
    const languages = [];
    if (bg.languageProficiencies && bg.languageProficiencies[0]) {
      const lp = bg.languageProficiencies[0];
      for (const [lang, value] of Object.entries(lp)) {
        if (value === true) {
          languages.push(lang);
        } else if (lang === 'anyStandard' && typeof value === 'number') {
          languages.push({ choose: { from: 'standard', count: value } });
        } else if (lang === 'any' && typeof value === 'number') {
          languages.push({ choose: { from: 'any', count: value } });
        }
      }
    }
    
    // Extract feature
    let feature = null;
    if (bg.entries) {
      const featureEntry = bg.entries.find(e => 
        e.type === 'entries' && e.name && e.name.startsWith('Feature:')
      );
      if (featureEntry) {
        feature = {
          name: featureEntry.name.replace('Feature: ', ''),
          description: featureEntry.entries ? featureEntry.entries.map(cleanText) : [],
        };
      }
    }
    
    output[key] = {
      key,
      name: bg.name,
      source: bg.source,
      page: bg.page,
      skillProficiencies,
      toolProficiencies,
      languages,
      feature,
      srd: bg.srd || false,
      basicRules: bg.basicRules || false,
    };
  }
  
  console.log(`  Processed ${Object.keys(output).length} backgrounds`);
  return output;
}

/**
 * Transform spells
 */
function transformSpells() {
  console.log('\nTransforming spells...');
  const spellsDir = path.join(SOURCE_DIR, 'spells');
  const output = {};
  
  // School abbreviations
  const schoolNames = {
    'A': 'Abjuration',
    'C': 'Conjuration',
    'D': 'Divination',
    'E': 'Enchantment',
    'V': 'Evocation',
    'I': 'Illusion',
    'N': 'Necromancy',
    'T': 'Transmutation',
  };
  
  // Read all spells-*.json files
  const spellFiles = fs.readdirSync(spellsDir)
    .filter(f => f.startsWith('spells-') && f.endsWith('.json'));
  
  for (const file of spellFiles) {
    const source = readJson(path.join(spellsDir, file));
    if (!source || !source.spell) continue;
    
    for (const spell of source.spell) {
      const key = makeKey(spell.name, spell.source);
      
      // Format casting time
      let castingTime = '';
      if (spell.time && spell.time[0]) {
        const t = spell.time[0];
        castingTime = `${t.number} ${t.unit}`;
      }
      
      // Format range
      let range = '';
      if (spell.range) {
        if (spell.range.type === 'point') {
          if (spell.range.distance) {
            if (spell.range.distance.type === 'self') {
              range = 'Self';
            } else if (spell.range.distance.type === 'touch') {
              range = 'Touch';
            } else {
              range = `${spell.range.distance.amount} ${spell.range.distance.type}`;
            }
          }
        } else if (spell.range.type === 'special') {
          range = 'Special';
        }
      }
      
      // Format components
      const components = {
        verbal: spell.components?.v || false,
        somatic: spell.components?.s || false,
        material: spell.components?.m ? 
          (typeof spell.components.m === 'string' ? spell.components.m : spell.components.m.text) : null,
      };
      
      // Format duration
      let duration = '';
      let concentration = false;
      if (spell.duration && spell.duration[0]) {
        const d = spell.duration[0];
        concentration = d.concentration || false;
        if (d.type === 'instant') {
          duration = 'Instantaneous';
        } else if (d.type === 'permanent') {
          duration = 'Permanent';
        } else if (d.type === 'timed') {
          duration = `${d.duration.amount} ${d.duration.type}`;
          if (concentration) duration = `Concentration, up to ${duration}`;
        } else if (d.type === 'special') {
          duration = 'Special';
        }
      }
      
      // Get classes that can use this spell
      const classes = spell.classes?.fromClassList?.map(c => 
        makeKey(c.name, c.source)
      ) || [];
      
      output[key] = {
        key,
        name: spell.name,
        source: spell.source,
        page: spell.page,
        level: spell.level,
        school: schoolNames[spell.school] || spell.school,
        castingTime,
        range,
        components,
        duration,
        concentration,
        ritual: spell.meta?.ritual || false,
        description: spell.entries ? spell.entries.map(cleanText) : [],
        higherLevel: spell.entriesHigherLevel ? 
          spell.entriesHigherLevel.map(e => e.entries ? e.entries.map(cleanText) : []).flat() : null,
        classes,
        srd: spell.srd || false,
        basicRules: spell.basicRules || false,
      };
    }
  }
  
  console.log(`  Processed ${Object.keys(output).length} spells`);
  return output;
}

/**
 * Transform items (equipment)
 */
function transformItems() {
  console.log('\nTransforming items...');
  
  const output = {};
  
  // Read both items.json and items-base.json
  const itemsSource = readJson(path.join(SOURCE_DIR, 'items.json'));
  const baseSource = readJson(path.join(SOURCE_DIR, 'items-base.json'));
  
  const allItems = [
    ...(baseSource?.baseitem || []),
    ...(itemsSource?.item || []),
  ];
  
  for (const item of allItems) {
    const key = makeKey(item.name, item.source);
    
    // Determine item type
    let type = 'other';
    if (item.armor) type = 'armor';
    else if (item.weapon) type = 'weapon';
    else if (item.type === 'SCF') type = 'spellcasting focus';
    else if (item.type === 'INS') type = 'instrument';
    else if (item.type === 'AT') type = 'artisan tools';
    else if (item.type === 'GS') type = 'gaming set';
    else if (item.type === 'T') type = 'tools';
    else if (item.type === 'G') type = 'gear';
    else if (item.type === 'A') type = 'ammunition';
    else if (item.type === '$') type = 'treasure';
    
    // Format value in GP
    let value = null;
    if (item.value) {
      value = item.value / 100; // 5etools stores in CP
    }
    
    output[key] = {
      key,
      name: item.name,
      source: item.source,
      page: item.page,
      type,
      weight: item.weight || null,
      value,
      // Armor specific
      ac: item.ac || null,
      armorType: item.armor ? (item.type === 'LA' ? 'light' : item.type === 'MA' ? 'medium' : item.type === 'HA' ? 'heavy' : 'shield') : null,
      strengthRequirement: item.strength || null,
      stealthDisadvantage: item.stealth || false,
      // Weapon specific
      damage: item.dmg1 || null,
      damageType: item.dmgType || null,
      properties: item.property || [],
      range: item.range ? `${item.range}/${item.range * 4}` : null,
      // Description
      entries: item.entries ? item.entries.map(cleanText) : null,
      srd: item.srd || false,
      basicRules: item.basicRules || false,
    };
  }
  
  console.log(`  Processed ${Object.keys(output).length} items`);
  return output;
}

/**
 * Transform feats
 */
function transformFeats() {
  console.log('\nTransforming feats...');
  const source = readJson(path.join(SOURCE_DIR, 'feats.json'));
  if (!source || !source.feat) return {};
  
  const output = {};
  
  for (const feat of source.feat) {
    const key = makeKey(feat.name, feat.source);
    
    // Extract prerequisites
    let prerequisites = null;
    if (feat.prerequisite && feat.prerequisite[0]) {
      const prereq = feat.prerequisite[0];
      prerequisites = {
        ability: prereq.ability || null,
        race: prereq.race ? prereq.race.map(r => makeKey(r.name, r.source)) : null,
        spellcasting: prereq.spellcasting || false,
        level: prereq.level || null,
        proficiency: prereq.proficiency || null,
      };
    }
    
    // Extract ability score increase if present
    let abilityIncrease = null;
    if (feat.ability && feat.ability[0]) {
      abilityIncrease = feat.ability[0];
    }
    
    output[key] = {
      key,
      name: feat.name,
      source: feat.source,
      page: feat.page,
      prerequisites,
      abilityIncrease,
      entries: feat.entries ? extractEntries(feat.entries) : [],
      srd: feat.srd || false,
      basicRules: feat.basicRules || false,
    };
  }
  
  console.log(`  Processed ${Object.keys(output).length} feats`);
  return output;
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log(' D&D 5E Data Transformation');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Transform each data type
  const races = transformRaces();
  const classes = transformClasses();
  const backgrounds = transformBackgrounds();
  const spells = transformSpells();
  const items = transformItems();
  const feats = transformFeats();
  
  // Write output files
  console.log('\nWriting output files...');
  writeJson(path.join(OUTPUT_DIR, 'races.json'), races);
  writeJson(path.join(OUTPUT_DIR, 'classes.json'), classes);
  writeJson(path.join(OUTPUT_DIR, 'backgrounds.json'), backgrounds);
  writeJson(path.join(OUTPUT_DIR, 'spells.json'), spells);
  writeJson(path.join(OUTPUT_DIR, 'items.json'), items);
  writeJson(path.join(OUTPUT_DIR, 'feats.json'), feats);
  
  // Generate manifest
  const manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    files: {
      races: { count: Object.keys(races).length, hash: hashFile(path.join(OUTPUT_DIR, 'races.json')) },
      classes: { count: Object.keys(classes).length, hash: hashFile(path.join(OUTPUT_DIR, 'classes.json')) },
      backgrounds: { count: Object.keys(backgrounds).length, hash: hashFile(path.join(OUTPUT_DIR, 'backgrounds.json')) },
      spells: { count: Object.keys(spells).length, hash: hashFile(path.join(OUTPUT_DIR, 'spells.json')) },
      items: { count: Object.keys(items).length, hash: hashFile(path.join(OUTPUT_DIR, 'items.json')) },
      feats: { count: Object.keys(feats).length, hash: hashFile(path.join(OUTPUT_DIR, 'feats.json')) },
    },
  };
  writeJson(path.join(OUTPUT_DIR, 'manifest.json'), manifest);
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(' Transformation complete!');
  console.log('═══════════════════════════════════════════════════════════');
}

main();
