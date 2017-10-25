class Application {
  constructor(config) {
    config = config || config;
    
    this.name = config.name;
    this.stores = config.stores || {};
    this.viewport = config.viewport;
  }

  launch() {
    var self = this;
    Object.keys(self.stores).forEach(name => {
      var store = self.stores[name];
      $(document).bind(store.constructor.name + 'LoadedEvent', function(e) {
        self.onStoreLoadedEvent(e);
      });
    });
    
    $('body').append(this.getComponent());
  }
  
  getComponent() {
    return $('<div>').addClass('application').append(this.viewport.getComponent());
  }
  
  onStoreLoadedEvent(e) {
    if (this.areStoresLoaded()) {
      this.initialize();
    }
  }
  
  areStoresLoaded() {
    return Object.keys(this.stores).every(name => this.stores[name].isLoaded());
  }
  
  initialize() {
    
  }
}

class Viewport {
  constructor(config) {
    config = config || config;
    this.title = config.title;
    this.items = config.items;
    this.width = config.width;
    this.parent = config.parent;
    
    this.initialize();
  }
  
  initialize() {
    var self = this;
    
    self.items.forEach((item, index) => {
      if (!(item instanceof Component)) {
        // Convert the item object into an instance.
        var component = new item.type({
          reference : item.reference,
          parent : self,
          store : typeof item.store === 'string' ? self.parent.stores[item.store] : item.store,
          dictionary : typeof item.dictionary === 'string' ? self.parent.stores[item.dictionary] : item.dictionary
        });

        self.items[index] = component;
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
    this.sorters = config.sorters;
    
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
    if (this.sorters) {
      this.sorters = this.sorters.map(sorter => {
        var isString = typeof sorter === 'string';
        return {
          field : isString ? sorter : sorter['field'],
          direction : isString ? 'asc' : sorter['direction']
        };
      });
    }
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
    
    if (self.sorters != null && self.sorters.length > 0) {
      self.sortBy(self.records, self.sorters);
    }
  }
  
  sortBy(records, sorters) {
    records.sort(function(objA, objB) {
        var result = 0;
        sorters.forEach(sorter => {
          result = (objA[sorter.field] < objB[sorter.field]) ? -1 : (objA[sorter.field] > objB[sorter.field]) ? 1 : 0;
          result *= sorter.direction === 'desc' ? -1 : 1;
        });
        return result;
    });
  }
}

class JsonStore extends Store {
  constructor(config) {
    super(config);
    this.dataType = 'json';
  }

  beforeLoad(config) {
    super.beforeLoad(config);
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
    this.parent = config.parent;
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

  getValue() {
    return this.el.val();
  }
  
  reload() {
    // Implement...
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
     
     this.initialize();
  }
  
  initialize() {
    if (typeof this.store === 'string') {
      this.store = this.parent.parent.stores[this.store];
    }

    var newDict = {};
    if (typeof this.dictionary === 'string') {
      var key = this.dictionary;
      newDict[key] = this.parent.parent.stores[key];
    } else if (Array.isArray(this.dictionary)) {
      this.dictionary.forEach(dict => {
        if (typeof dict === 'string') {
          newDict[dict] = this.parent.parent.stores[dict];
        } else {
          newDict[dict.constructor.name] = dict;
        }
      });
    }
    this.dictionary = newDict;

    if (this.store && this.store.isLoaded()) {
      this.reload();
    }
  }

  reload() {
    var self = this;
    self.el.empty().append(self.store.retrieveAll().map(record => {
      var displayText = record[self.displayField];
      if (self.dictionary) {
        displayText = self.lookupText(displayText, record, this.dictionary);
      }
      return $('<option>').text(displayText).val(record[self.valueField]);
    }));
  }
  
  lookupText(key, record, dictionary) {
    dictionary = dictionary || this.dictionary;
    var availDicts = Object.keys(dictionary);
    var targetDict = dictionary[availDicts[0]];
    return targetDict.lookup(key);
  }
}
