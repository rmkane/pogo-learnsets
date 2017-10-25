const movePattern = /^V(\d{4})_MOVE_\w+$/;
const pokemonPattern = /^V(\d{4})_POKEMON_\w+$/;

class Model {
  constructor() {
    if (new.target === Model) {
      throw new TypeError("Cannot construct Model instances directly");
    }

    this.id = null;
    this.name = null;
    this.index = 0;
  }
}

class Move extends Model {
  constructor() {
    super();
    
    this.type = null;
    this.power = 0;
    this.duration = 0;
    this.energy = 0;
  }

  calculateDamagePerSecond() {
    return this.power / (this.duration / 1000.0);
  }

  calculateEnergyPerSecond() {
    return this.energy / (this.duration / 1000.0);
  }

  isFast() {
    return this.name.includes('_FAST');
  }

  static parse(data) {
    var m = new Move();
    var tokens = data.templateId.match(movePattern);
    
    m.id = data.templateId;
    m.name = data.moveSettings.movementId;
    m.index = parseInt(tokens[1], 10);

    m.type = data.moveSettings.pokemonType;
    m.power = data.moveSettings.power;
    m.duration = data.moveSettings.durationMs;
    m.energy = data.moveSettings.energyDelta;
    
    return m;
  }
}

class Pokemon extends Model {
  constructor() {
    super();

    this.type1 = null;
    this.type2 = null;
    this.height = 0;
    this.weight = 0;
    this.stamina = 0;
    this.attack = 0;
    this.defense = 0;
    this.captureRate = 0;
    this.fleeRate = 0;
    this.fastAttacks = [];
    this.chargedAttacks = [];
    this.buddyDistance = 0;
    this.buddySize = null;
    this.evolvesFrom = null;
    this.family = null;
  }
  
  static parse(data) {
    var p = new Pokemon();
    var tokens = data.templateId.match(pokemonPattern);

    p.id = data.templateId;
    p.name = data.pokemonSettings.pokemonId;
    p.index = parseInt(tokens[1], 10);

    p.type1 = data.pokemonSettings.type;
    p.type2 = data.pokemonSettings.type2;
    p.height = data.pokemonSettings.pokedexHeightM;
    p.weight = data.pokemonSettings.pokedexWeightKg;
    p.stamina = data.pokemonSettings.stats.baseStamina;
    p.attack = data.pokemonSettings.stats.baseAttack;
    p.defense = data.pokemonSettings.stats.baseDefense;
    p.captureRate = data.pokemonSettings.encounter.baseCaptureRate;
    p.fleeRate = data.pokemonSettings.encounter.baseFleeRate;
    p.fastAttacks = data.pokemonSettings.quickMoves;
    p.chargedAttacks = data.pokemonSettings.cinematicMoves;
    p.buddyDistance = data.pokemonSettings.kmBuddyDistance;
    p.buddySize = data.pokemonSettings.buddySize;
    p.evolvesFrom = data.pokemonSettings.parentPokemonId;
    p.family = data.pokemonSettings.familyId;

    return p;
  }
}

class MoveStore extends JsonStore {
  constructor() {
    super({
      url : "assets/data/GAME_MASTER.json",
      rootProperty : 'itemTemplates',
      model : Move,
      autoLoad : true,
      sorters : [ 'name' ],
      filterFn : (record) => movePattern.test(record.templateId)
    });
  }
}

class PokemonStore extends JsonStore {
  constructor() {
    super({
      url : "assets/data/GAME_MASTER.json",
      rootProperty : 'itemTemplates',
      model : Pokemon,
      autoLoad : true,
      filterFn : (record) => pokemonPattern.test(record.templateId)
    });
  }
}

class MoveDictionary extends Dictionary {
  constructor(language) {
    super({
      resource : "assets/language/moves.txt",
      language : language
    });
  }
}

class PokemonDictionary extends Dictionary {
  constructor(language) {
    super({
      resource : "assets/language/pokemon.txt",
      language : language
    });
  }
}

class GeneralDictionary extends Dictionary {
  constructor(language) {
    super({
      resource : "assets/language/general.txt",
      language : language
    });
  }
}