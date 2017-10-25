class Application {
  constructor(config) {
    config = config || config;
    this.name = config.name;
    this.stores = config.stores || {};
    this.viewport = config.viewport;
  }

  launch() {
    $('body').append($('<div>').addClass('application').append(this.viewport.getComponent()));
  }
}

class Viewport {
  constructor(config) {
    config = config || config;
    this.title = config.title;
    this.items = config.items;
    this.width = config.width;
    
    this.initialize();
  }
  
  initialize() {
    this.items.forEach((item, index) => {
      if (!(item instanceof Component)) {
        // Convert the item object into an instance.
        this.items[index] = new item.type({
          reference : item.reference
        });
      }
    });
  }

  getComponent() {
    return $('<div>').addClass('viewport').css('width', this.width)
      .append($('<h1>').addClass('viewport-title').text(this.title))
      .append($('<div>').addClass('viewport-content')
        .append($('<form>').addClass('viewport-content-form')
          .append(this.items.map(item => item.getComponent()))));
  }
}

/*
 * Available Languages: English, Japanese, French, Spanish, German, Italian, Korean, ChineseTraditional, BrazilianPortuguese
 */
class Dictionary {
  constructor(config) {
    if (new.target === Dictionary) {
      throw new TypeError("Cannot construct Dictionary instances directly");
    }
    config = config || {};
    this.dict = {};
    this.loaded = false;
    this.resource = config.resource;
    this.language = config.language || 'English';
    this.delimiter = config.delimiter || '\t';
    this.reload();
  }

  isLoaded() {
    return this.loaded;
  }

  reload(data) {
    var self = this;

    $.ajax({
      url: self.resource,
      type : 'GET',
      cache : true,
      dataType : self.dataType,
      success : (result, status, xhr) => {
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
    var dict = {};
    var rows = data.trim().split(/\n/);
    var fields = rows[0].split(this.delimiter).map(self.trimValue);
    var valueIndex = fields.indexOf(this.language);

    rows.forEach((row, index) => {
      if (index === 0) {
        return; // Skip first row.
      }
      var values = row.split(this.delimiter).map(self.trimValue);
      dict[values[0]] = values[valueIndex];
    });

    this.dict = dict;
  }

  trimValue(value) {
    return (value.startsWith('"') && value.endsWith('"')) ? value.slice(1, -1) : value;
  }

  lookup(key) {
    return this.dict[key];
  }
}

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
  constructor(el, config) {
    if (new.target === Component) {
      throw new TypeError("Cannot construct Component instances directly");
    }
    config = config || {};
    this.el = el;
    this.reference = config.reference;
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
    super(el, config);
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
     this.dictionary = config.dictionary;
     this.valueField = config.valueField;
     this.displayField = config.displayField;
     
     if (this.store.isLoaded()) {
       this.reload();
     }
  }

  reload() {
    var self = this;
    self.el.empty().append(self.store.retrieveAll().map(record => {
      var displayText = record[self.displayField];
      if (self.dictionary) {
        displayText = self.lookupText(displayText, record);
      }
      return $('<option>').text(displayText).val(record[self.valueField]);
    }));
  }
  
  lookupText(key, record) {
    return this.dictionary.lookup(key);
  }
}
