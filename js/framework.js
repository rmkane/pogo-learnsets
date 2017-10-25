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

/*
 * Available Languages: English, Japanese, French, Spanish, German, Italian, Korean, ChineseTraditional, BrazilianPortuguese
 */
class LanguageVariable extends Model {
  static parse(data) {
    var v = new LanguageVariable();
    var id = parseInt(data['Key'].replace(/[^\d]/g, ''), 10);

    v.id = id;
    v.name = data['Key'];
    v.index = LanguageVariable.INDEX_COUNTER;
    v.value = data[LanguageVariable.LANGUAGE];

    LanguageVariable.INDEX_COUNTER++;

    return v;
  }
}
LanguageVariable.INDEX_COUNTER = 0;
LanguageVariable.LANGUAGE = 'English';

class Store {
  constructor(config) {
    if (new.target === Store) {
      throw new TypeError("Cannot construct Store instances directly");
    }
  
    config = config || {};
    
    this.dataType = null; // json, text, etc...
    this.records = [];
    this.loaded = false;
    
    this.model = config.model;
    this.rootProperty = config.rootProperty;
    this.url = config.url;
    
    this.autoLoad = config.autoLoad || false;
    this.filterFn = config.filterFn;

    this.beforeLoad(config);
    
    if (this.autoLoad) {
      this.load();
    }
  }
  
  retrieveAll() {
    return this.records;
  }

  retrieveById(id) {
    return this._retrieveBy('id', id);
  }

  retrieveByName(name, partial) {
    return this._retrieveBy('name', name, partial);
  }

  retrieveByIndex(index) {
    return this._retrieveBy('index', index);
  }

  /**
   * @private
   */
  _retrieveBy(key, value, partial) {
    return this.retrieveAll().filter(item => partial ? (item[key].includes(value)) : (item[key] === value)).slice(0);
  }

  isLoaded() {
    return this.loaded;
  }

  processRecord(item) {
    return this.model.parse(item);
  }

  beforeLoad(config) {
    
  }
  
  load() {
    var self = this;

    $.ajax({
      url: self.url,
      type : 'GET',
      cache : true,
      dataType : self.dataType,
      success : (result, status, xhr) => {
        if (result == null) {
          throw new Error('Result was empty!');
        }
        self.processData(result);
        self.loaded = true;
        $.event.trigger(self.constructor.name + 'LoadedEvent');
      },
      error : (xhr, status, error) => {
        throw new Error(error);
      }
    });
  }
  
  processData(data) {
    var self = this;
    data.forEach((item) => {
      if (self.filterFn ? self.filterFn(item) : true) {
        self.records.push(self.processRecord(item))
      }
    });
  }
}

class JsonStore extends Store {
  constructor(config) {
    super(config);
    this.dataType = 'json';
  }

  beforeLoad(config) {
    this.rootProperty = config.rootProperty;
  }
  
  processData(data) {
    super.processData(this.rootProperty ? data[this.rootProperty] : data);
  }
}

class CsvStore extends Store {
  constructor(config) {
    super(config);
    this.dataType = 'text';
    this.delimiter = config.delimiter || '\t';
    this.headersIncluded = config.headersIncluded;
  }

  trimValue(value) {
    return (value.startsWith('"') && value.endsWith('"')) ? value.slice(1, -1) : value;
  }
  
  processData(data) {
    var self = this;
    var records = [];
    var fields = [];
    var rows = data.trim().split(/\n/);

    if (this.headersIncluded) {
      fields = rows[0].split(this.delimiter).map(header => self.trimValue(header));
    } else {
      fields = rows[0].map((_, i) => `field_{i}`);
    }

    rows.forEach((row, index) => {
      if (index === 0 && this.headersIncluded) {
        return; // Skip first row.
      }

      var record = {};
      var values = row.split(this.delimiter);
      fields.forEach((field, i) => {
        record[field] = self.trimValue(values[i]);
      });
      records.push(record);
    });

    super.processData(records);
  }
}

class TextStore extends CsvStore {
  constructor(config) {
    super($.extend({
      model : LanguageVariable,
      headersIncluded : true,
      autoLoad : true
    }, config || {}));
  }
}

class Component {
  constructor(el) {
    if (new.target === Component) {
      throw new TypeError("Cannot construct Component instances directly");
    }
    this.el = el;
  }
  
  getComponent() {
    return this.el;
  }
  
  destroy() {
    this.el.remove();
  }
}

class Field extends Component {
  constructor(el, config) {
    super(el);
    config = config || {};
    this.fieldLabel = config.fieldLabel;
  }

  getComponent() {
    return $('<div>').addClass('form-group')
      .append($('<label>').text(this.fieldLabel))
      .append(super.getComponent());
  }
}

class ComboBox extends Field {
  constructor(config) {
     super($('<select>').addClass('form-control'), config);
     config = config || {};
     this.store = config.store;
     this.valueField = config.valueField;
     this.displayField = config.displayField;
     
     if (this.store.isLoaded()) {
       this.reload();
     }
  }

  reload() {
    var self = this;
    self.el.empty().append(self.store.retrieveAll().map(record => {
      return $('<option>').text(record[self.displayField]).val(record[self.valueField]);
    }));
  }
}
