/**
 * CharacterCalculator - Core Rules Engine
 * 
 * This module contains pure functions for computing derived character data.
 * All game rules are read from the provided GameData and RulesConfig objects.
 * No game content is hardcoded in this module.
 */

import { create, all, MathJsInstance } from 'mathjs';
import type {
  CharacterState,
  ComputedCharacter,
  GameData,
  RulesConfig,
  AbilityScores,
  AbilityModifiers,
  AbilityKey,
  ClassLevel,
  Feature,
  Proficiencies,
  SpellcastingInfo,
  HPInfo,
  ACInfo,
  SpeedInfo,
  SkillInfo,
  SavingThrowInfo,
  AttackInfo,
  ProficiencyLevel,
  RaceData,
  ClassData,
  SubraceData,
} from '../types';

// =============================================================================
// FORMULA EVALUATOR
// =============================================================================

// Create a restricted math.js instance for safe formula evaluation
const mathInstance: MathJsInstance = create(all);

// Restrict to safe operations only
const limitedEvaluate = mathInstance.evaluate;
mathInstance.import({
  'import': function() { throw new Error('Function import is disabled'); },
  'createUnit': function() { throw new Error('Function createUnit is disabled'); },
  'evaluate': function() { throw new Error('Function evaluate is disabled'); },
  'parse': function() { throw new Error('Function parse is disabled'); },
  'simplify': function() { throw new Error('Function simplify is disabled'); },
  'derivative': function() { throw new Error('Function derivative is disabled'); },
}, { override: true });

/**
 * Safely evaluate a formula string with the given context variables
 */
export function evaluateFormula(
  formula: string,
  context: Record<string, number>,
  tables?: Record<string, Record<string, number>>
): number {
  try {
    // Add table lookup function to context
    const scope = {
      ...context,
      lookup: (tableName: string, key: string | number) => {
        if (!tables || !tables[tableName]) {
          throw new Error(`Table '${tableName}' not found`);
        }
        const value = tables[tableName][String(key)];
        if (value === undefined) {
          throw new Error(`Key '${key}' not found in table '${tableName}'`);
        }
        return value;
      },
    };

    const result = limitedEvaluate(formula, scope);
    
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error(`Formula '${formula}' did not evaluate to a finite number`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error evaluating formula '${formula}':`, error);
    throw error;
  }
}

// =============================================================================
// ABILITY SCORES
// =============================================================================

/**
 * Compute ability modifiers from ability scores
 */
export function computeAbilityModifiers(
  scores: AbilityScores,
  rules: RulesConfig
): AbilityModifiers {
  const formula = rules.formulas.abilityModifier;
  const abilities = Object.keys(rules.abilities) as AbilityKey[];
  
  return abilities.reduce((mods, ability) => {
    mods[ability] = evaluateFormula(formula, { score: scores[ability] });
    return mods;
  }, {} as AbilityModifiers);
}

/**
 * Compute final ability scores including racial bonuses, ASIs, and feat bonuses
 */
export function computeAbilityScores(
  state: CharacterState,
  data: GameData
): AbilityScores {
  const base = { ...state.baseAbilityScores };
  
  // Apply racial ability bonuses
  const race = data.races[state.raceKey];
  if (race?.abilityBonuses) {
    for (const [ability, bonus] of Object.entries(race.abilityBonuses)) {
      if (bonus !== undefined) {
        base[ability as AbilityKey] += bonus;
      }
    }
  }
  
  // Apply subrace ability bonuses
  if (state.subraceKey && race?.subraces) {
    const subrace = race.subraces.find(sr => sr.key === state.subraceKey);
    if (subrace?.abilityBonuses) {
      for (const [ability, bonus] of Object.entries(subrace.abilityBonuses)) {
        if (bonus !== undefined) {
          base[ability as AbilityKey] += bonus;
        }
      }
    }
  }
  
  // Apply Ability Score Improvements from class levels
  for (const classLevel of state.classes) {
    const classData = data.classes[classLevel.classKey];
    if (!classData) continue;
    
    for (const feature of classData.features) {
      if (feature.level <= classLevel.level && feature.choices?.type === 'ability') {
        const choice = state.choices.find(
          c => c.featureId === `${classLevel.classKey}-${feature.level}-${feature.name}`
        );
        if (choice && Array.isArray(choice.chosen)) {
          for (const abilityChoice of choice.chosen) {
            const [ability, amount] = abilityChoice.split(':');
            if (ability && amount) {
              base[ability as AbilityKey] += parseInt(amount, 10);
            }
          }
        }
      }
    }
  }
  
  // Apply feat ability bonuses
  for (const featKey of state.feats) {
    const feat = data.feats[featKey];
    if (!feat?.grants?.abilityIncrease) continue;
    
    const choice = state.choices.find(c => c.featureId === `feat-${featKey}-ability`);
    if (choice && typeof choice.chosen === 'string') {
      const [ability, amount] = choice.chosen.split(':');
      if (ability && amount) {
        base[ability as AbilityKey] += parseInt(amount, 10);
      }
    }
  }
  
  // Cap at 20 (unless a feature explicitly allows higher)
  for (const ability of Object.keys(base) as AbilityKey[]) {
    base[ability] = Math.min(base[ability], 20);
  }
  
  return base;
}

// =============================================================================
// LEVEL AND PROFICIENCY
// =============================================================================

export function computeTotalLevel(classes: ClassLevel[]): number {
  return classes.reduce((sum, cl) => sum + cl.level, 0);
}

export function computeProficiencyBonus(totalLevel: number, rules: RulesConfig): number {
  if (rules.proficiencyBonusTable[String(totalLevel)]) {
    return rules.proficiencyBonusTable[String(totalLevel)];
  }
  return evaluateFormula(rules.formulas.proficiencyBonus, { totalLevel });
}

// =============================================================================
// PROFICIENCIES
// =============================================================================

export function computeProficiencies(
  state: CharacterState,
  data: GameData
): Proficiencies {
  const proficiencies: Proficiencies = {
    armor: [],
    weapons: [],
    tools: [],
    skills: [],
    savingThrows: [],
    languages: [],
  };
  
  const addUnique = <T>(arr: T[], items: T[]) => {
    for (const item of items) {
      if (!arr.includes(item)) arr.push(item);
    }
  };
  
  // From first class
  if (state.classes.length > 0) {
    const firstClass = data.classes[state.classes[0].classKey];
    if (firstClass) {
      addUnique(proficiencies.armor, firstClass.armorProficiencies);
      addUnique(proficiencies.weapons, firstClass.weaponProficiencies);
      addUnique(proficiencies.savingThrows, firstClass.savingThrowProficiencies);
      
      const skillChoice = state.choices.find(
        c => c.featureId === `${firstClass.key}-skills` && c.source === 'class'
      );
      if (skillChoice && Array.isArray(skillChoice.chosen)) {
        addUnique(proficiencies.skills, skillChoice.chosen);
      }
      
      if (Array.isArray(firstClass.toolProficiencies)) {
        addUnique(proficiencies.tools, firstClass.toolProficiencies);
      }
    }
  }
  
  // From race
  const race = data.races[state.raceKey];
  if (race?.proficiencies) {
    if (race.proficiencies.armor) addUnique(proficiencies.armor, race.proficiencies.armor);
    if (race.proficiencies.weapons) addUnique(proficiencies.weapons, race.proficiencies.weapons);
    if (race.proficiencies.tools) addUnique(proficiencies.tools, race.proficiencies.tools);
    if (race.proficiencies.skills) addUnique(proficiencies.skills, race.proficiencies.skills);
    if (race.proficiencies.languages) addUnique(proficiencies.languages, race.proficiencies.languages);
  }
  
  // From background
  const background = data.backgrounds[state.backgroundKey];
  if (background) {
    addUnique(proficiencies.skills, background.skillProficiencies);
    if (Array.isArray(background.toolProficiencies)) {
      addUnique(proficiencies.tools, background.toolProficiencies);
    }
  }
  
  // Process choices
  for (const choice of state.choices) {
    if (choice.source === 'background' || choice.source === 'race') {
      if (choice.featureId.includes('language') && Array.isArray(choice.chosen)) {
        addUnique(proficiencies.languages, choice.chosen);
      }
      if (choice.featureId.includes('tool') && Array.isArray(choice.chosen)) {
        addUnique(proficiencies.tools, choice.chosen);
      }
      if (choice.featureId.includes('skill') && Array.isArray(choice.chosen)) {
        addUnique(proficiencies.skills, choice.chosen);
      }
    }
  }
  
  // From feats
  for (const featKey of state.feats) {
    const feat = data.feats[featKey];
    if (feat?.grants?.proficiencies) {
      const fp = feat.grants.proficiencies;
      if (fp.armor) addUnique(proficiencies.armor, fp.armor);
      if (fp.weapons) addUnique(proficiencies.weapons, fp.weapons);
      if (fp.tools) addUnique(proficiencies.tools, fp.tools);
      if (fp.skills) addUnique(proficiencies.skills, fp.skills);
      if (fp.languages) addUnique(proficiencies.languages, fp.languages);
    }
  }
  
  return proficiencies;
}

// =============================================================================
// SKILLS AND SAVING THROWS
// =============================================================================

export function computeSkills(
  abilityModifiers: AbilityModifiers,
  proficiencies: Proficiencies,
  proficiencyBonus: number,
  rules: RulesConfig,
  expertiseSkills: string[] = []
): Record<string, SkillInfo> {
  const skills: Record<string, SkillInfo> = {};
  
  for (const [skillKey, skillDef] of Object.entries(rules.skills)) {
    const ability = skillDef.ability;
    const abilityMod = abilityModifiers[ability];
    
    let proficiency: ProficiencyLevel = 'none';
    let modifier = abilityMod;
    
    if (expertiseSkills.includes(skillKey)) {
      proficiency = 'expertise';
      modifier += proficiencyBonus * 2;
    } else if (proficiencies.skills.includes(skillKey)) {
      proficiency = 'proficient';
      modifier += proficiencyBonus;
    }
    
    skills[skillKey] = {
      modifier,
      proficiency,
      ability,
      passive: 10 + modifier,
    };
  }
  
  return skills;
}

export function computeSavingThrows(
  abilityModifiers: AbilityModifiers,
  proficiencies: Proficiencies,
  proficiencyBonus: number,
  rules: RulesConfig
): Record<AbilityKey, SavingThrowInfo> {
  const saves: Record<AbilityKey, SavingThrowInfo> = {} as Record<AbilityKey, SavingThrowInfo>;
  
  for (const ability of Object.keys(rules.abilities) as AbilityKey[]) {
    const proficient = proficiencies.savingThrows.includes(ability);
    saves[ability] = {
      modifier: abilityModifiers[ability] + (proficient ? proficiencyBonus : 0),
      proficient,
    };
  }
  
  return saves;
}

// =============================================================================
// HIT POINTS
// =============================================================================

export function computeHP(
  state: CharacterState,
  conModifier: number,
  data: GameData
): HPInfo {
  let maxHp = 0;
  const hitDice: Record<string, { total: number; used: number }> = {};
  
  for (const classLevel of state.classes) {
    const classData = data.classes[classLevel.classKey];
    if (!classData) continue;
    
    const hitDie = `d${classData.hitDie}`;
    
    if (!hitDice[hitDie]) {
      hitDice[hitDie] = { total: 0, used: 0 };
    }
    hitDice[hitDie].total += classLevel.level;
    
    if (classLevel === state.classes[0]) {
      maxHp += classData.hitDie + conModifier;
      for (let level = 2; level <= classLevel.level; level++) {
        const avgRoll = Math.ceil(classData.hitDie / 2) + 1;
        maxHp += avgRoll + conModifier;
      }
    } else {
      for (let level = 1; level <= classLevel.level; level++) {
        const avgRoll = Math.ceil(classData.hitDie / 2) + 1;
        maxHp += avgRoll + conModifier;
      }
    }
  }
  
  if (state.hitDiceUsed) {
    for (const [die, used] of Object.entries(state.hitDiceUsed)) {
      if (hitDice[die]) hitDice[die].used = used;
    }
  }
  
  return {
    max: Math.max(1, maxHp),
    current: state.currentHp,
    temp: state.tempHp,
    hitDice,
  };
}

// =============================================================================
// ARMOR CLASS
// =============================================================================

export function computeAC(
  state: CharacterState,
  abilityModifiers: AbilityModifiers,
  data: GameData,
  rules: RulesConfig
): ACInfo {
  const breakdown: string[] = [];
  
  const equippedArmor = state.equipment.find(
    e => e.equipped && data.items[e.itemKey]?.armorType && 
         data.items[e.itemKey]?.armorType !== 'shield'
  );
  const equippedShield = state.equipment.find(
    e => e.equipped && data.items[e.itemKey]?.armorType === 'shield'
  );
  
  let baseAC = 10;
  let dexBonus = abilityModifiers.dex;
  let source = 'Unarmored';
  
  if (equippedArmor) {
    const armor = data.items[equippedArmor.itemKey];
    if (armor?.armorClass !== undefined) {
      baseAC = armor.armorClass;
      source = armor.name;
      
      switch (armor.armorType) {
        case 'light':
          breakdown.push(`${armor.name}: ${baseAC}`);
          breakdown.push(`Dexterity: +${dexBonus}`);
          break;
        case 'medium':
          dexBonus = Math.min(dexBonus, 2);
          breakdown.push(`${armor.name}: ${baseAC}`);
          breakdown.push(`Dexterity (max 2): +${dexBonus}`);
          break;
        case 'heavy':
          dexBonus = 0;
          breakdown.push(`${armor.name}: ${baseAC}`);
          break;
      }
    }
  } else {
    breakdown.push(`Base: 10`);
    breakdown.push(`Dexterity: +${dexBonus}`);
  }
  
  let totalAC = baseAC + dexBonus;
  
  if (equippedShield) {
    const shield = data.items[equippedShield.itemKey];
    if (shield?.armorClass) {
      totalAC += shield.armorClass;
      breakdown.push(`Shield: +${shield.armorClass}`);
    }
  }
  
  return { value: totalAC, source, breakdown };
}

// =============================================================================
// SPEED
// =============================================================================

export function computeSpeed(state: CharacterState, data: GameData): SpeedInfo {
  const race = data.races[state.raceKey];
  let speed: SpeedInfo = { walk: 30 };
  
  if (race) {
    if (typeof race.speed === 'number') {
      speed.walk = race.speed;
    } else if (typeof race.speed === 'object') {
      speed = { ...race.speed };
    }
  }
  
  if (state.subraceKey && race?.subraces) {
    const subrace = race.subraces.find(sr => sr.key === state.subraceKey);
    if (subrace?.overrides?.speed) {
      if (typeof subrace.overrides.speed === 'number') {
        speed.walk = subrace.overrides.speed;
      } else {
        speed = { ...speed, ...subrace.overrides.speed };
      }
    }
  }
  
  return speed;
}

// =============================================================================
// FEATURES
// =============================================================================

export function computeFeatures(state: CharacterState, data: GameData): Feature[] {
  const features: Feature[] = [];
  
  const race = data.races[state.raceKey];
  if (race?.traits) {
    for (const trait of race.traits) {
      features.push({
        id: `race-${race.key}-${trait.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: trait.name,
        source: 'race',
        sourceKey: race.key,
        description: trait.description,
        hasChoices: !!trait.choices,
      });
    }
  }
  
  if (state.subraceKey && race?.subraces) {
    const subrace = race.subraces.find(sr => sr.key === state.subraceKey);
    if (subrace?.traits) {
      for (const trait of subrace.traits) {
        features.push({
          id: `subrace-${subrace.key}-${trait.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: trait.name,
          source: 'race',
          sourceKey: subrace.key,
          description: trait.description,
          hasChoices: !!trait.choices,
        });
      }
    }
  }
  
  for (const classLevel of state.classes) {
    const classData = data.classes[classLevel.classKey];
    if (!classData) continue;
    
    for (const feature of classData.features) {
      if (feature.level <= classLevel.level) {
        features.push({
          id: `class-${classData.key}-${feature.level}-${feature.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: feature.name,
          source: 'class',
          sourceKey: classData.key,
          level: feature.level,
          description: feature.description,
          hasChoices: !!feature.choices,
        });
      }
    }
    
    if (classLevel.subclassKey) {
      const subclass = classData.subclasses?.find(sc => sc.key === classLevel.subclassKey);
      if (subclass) {
        for (const feature of subclass.features) {
          if (feature.level <= classLevel.level) {
            features.push({
              id: `subclass-${subclass.key}-${feature.level}-${feature.name.toLowerCase().replace(/\s+/g, '-')}`,
              name: feature.name,
              source: 'class',
              sourceKey: subclass.key,
              level: feature.level,
              description: feature.description,
              hasChoices: !!feature.choices,
            });
          }
        }
      }
    }
  }
  
  const background = data.backgrounds[state.backgroundKey];
  if (background?.feature) {
    features.push({
      id: `background-${background.key}-feature`,
      name: background.feature.name,
      source: 'background',
      sourceKey: background.key,
      description: background.feature.description,
    });
  }
  
  for (const featKey of state.feats) {
    const feat = data.feats[featKey];
    if (feat) {
      features.push({
        id: `feat-${feat.key}`,
        name: feat.name,
        source: 'feat',
        sourceKey: feat.key,
        description: feat.description,
        hasChoices: !!feat.grants?.abilityIncrease,
      });
    }
  }
  
  return features;
}

// =============================================================================
// SPELLCASTING
// =============================================================================

type ClassSpellcastingData = NonNullable<ClassData['spellcasting']>;

function getPactSlots(level: number): number {
  if (level < 1) return 0;
  if (level < 2) return 1;
  if (level < 11) return 2;
  if (level < 17) return 3;
  return 4;
}

function getPactSlotLevel(level: number): number {
  if (level < 1) return 0;
  if (level < 3) return 1;
  if (level < 5) return 2;
  if (level < 7) return 3;
  if (level < 9) return 4;
  return 5;
}

export function computeSpellcasting(
  state: CharacterState,
  abilityModifiers: AbilityModifiers,
  proficiencyBonus: number,
  data: GameData,
  rules: RulesConfig
): SpellcastingInfo | undefined {
  let primarySpellcasting: ClassSpellcastingData | null = null;
  let primaryClassLevel = 0;
  
  for (const classLevel of state.classes) {
    const classData = data.classes[classLevel.classKey];
    if (classData?.spellcasting) {
      primarySpellcasting = classData.spellcasting;
      primaryClassLevel = classLevel.level;
      break;
    }
    
    if (classLevel.subclassKey) {
      const subclass = classData?.subclasses?.find(sc => sc.key === classLevel.subclassKey);
      if (subclass?.spellcasting) {
        primarySpellcasting = subclass.spellcasting;
        primaryClassLevel = classLevel.level;
        break;
      }
    }
  }
  
  if (!primarySpellcasting) return undefined;
  
  const ability = primarySpellcasting.ability;
  const spellMod = abilityModifiers[ability];
  
  if (primarySpellcasting.type === 'pact') {
    return {
      ability,
      attackBonus: proficiencyBonus + spellMod,
      saveDC: 8 + proficiencyBonus + spellMod,
      cantripsKnown: primarySpellcasting.cantripsKnownTable?.[primaryClassLevel - 1] || 0,
      pactSlots: getPactSlots(primaryClassLevel),
      pactSlotLevel: getPactSlotLevel(primaryClassLevel),
      ritualCasting: primarySpellcasting.ritual,
    };
  }
  
  let casterLevel = 0;
  for (const classLevel of state.classes) {
    const classData = data.classes[classLevel.classKey];
    const spellcasting = classData?.spellcasting || 
      classData?.subclasses?.find(sc => sc.key === classLevel.subclassKey)?.spellcasting;
    
    if (spellcasting) {
      const multiplier = rules.multiclassSpellSlots.casterLevelMultipliers[spellcasting.type] || 0;
      casterLevel += Math.floor(classLevel.level * multiplier);
    }
  }
  
  const spellSlots = casterLevel > 0 
    ? rules.multiclassSpellSlots.table[String(casterLevel)] || []
    : [];
  
  return {
    ability,
    attackBonus: proficiencyBonus + spellMod,
    saveDC: 8 + proficiencyBonus + spellMod,
    spellSlots,
    cantripsKnown: primarySpellcasting.cantripsKnownTable?.[primaryClassLevel - 1] || 0,
    spellsKnown: primarySpellcasting.spellsKnownTable?.[primaryClassLevel - 1],
    ritualCasting: primarySpellcasting.ritual,
    spellbook: primarySpellcasting.spellbook,
  };
}

// =============================================================================
// MAIN COMPUTATION
// =============================================================================

export function computeCharacter(
  state: CharacterState,
  data: GameData
): ComputedCharacter {
  const rules = data.rules;
  
  const abilityScores = computeAbilityScores(state, data);
  const abilityModifiers = computeAbilityModifiers(abilityScores, rules);
  const totalLevel = computeTotalLevel(state.classes);
  const proficiencyBonus = computeProficiencyBonus(totalLevel, rules);
  const proficiencies = computeProficiencies(state, data);
  
  const skills = computeSkills(abilityModifiers, proficiencies, proficiencyBonus, rules);
  const savingThrows = computeSavingThrows(abilityModifiers, proficiencies, proficiencyBonus, rules);
  
  const hp = computeHP(state, abilityModifiers.con, data);
  const ac = computeAC(state, abilityModifiers, data, rules);
  const speed = computeSpeed(state, data);
  const initiative = abilityModifiers.dex;
  
  const features = computeFeatures(state, data);
  const spellcasting = computeSpellcasting(state, abilityModifiers, proficiencyBonus, data, rules);
  
  const attacks: AttackInfo[] = [];
  const resistances: string[] = [];
  const immunities: string[] = [];
  const vulnerabilities: string[] = [];
  const conditionImmunities: string[] = [];
  const senses: ComputedCharacter['senses'] = {};
  
  const race = data.races[state.raceKey];
  if (race?.traits) {
    for (const trait of race.traits) {
      if (trait.grants?.senses) Object.assign(senses, trait.grants.senses);
      if (trait.grants?.resistances) resistances.push(...trait.grants.resistances);
      if (trait.grants?.immunities) immunities.push(...trait.grants.immunities);
    }
  }
  
  return {
    ...state,
    baseAbilityScores: state.baseAbilityScores,
    abilityScores,
    abilityModifiers,
    totalLevel,
    proficiencyBonus,
    savingThrows,
    skills,
    hp,
    ac,
    initiative,
    speed,
    attacks,
    features,
    proficiencies,
    spellcasting,
    resistances,
    immunities,
    vulnerabilities,
    conditionImmunities,
    senses,
  };
}
