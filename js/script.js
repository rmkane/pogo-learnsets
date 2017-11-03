function formatKey(prefix, padding, value) {
  return prefix + '_' + (padding + value).slice(-padding.length);
}
function formatId(prefix, value) {
  return formatKey(prefix, '0000', value);
}
function formatAttack(id, store, dict, dictGeneral) {
  var attack = store.retrieveByName(id, true)[0];

  return {
    name : dict.lookup(formatId('move_name', attack.index)),
    type : dictGeneral.lookup(attack.type.toLowerCase())
    //power : attack.power,
    //energy : attack.energy,
    //duration : attack.duration,
    //moveType : attack.isFast() ? 'Fast' : 'Charged'
  };
}

class MovesCombo extends ComboBox {
  constructor(config) {
    super($.extend({
      fieldLabel : 'Moves',
      store : 'moveStore',
      dictionary : [ 'moveDictionary', 'generalDictionary' ],
      valueField : 'id',
      displayField : 'name'
    }, config));
  }

  lookupText(key, record, dictionary) {
    var moveName = super.lookupText(formatId('move_name', record.index));
    var type = this.dictionary['generalDictionary'].lookup(record.type.toLowerCase());
    var moveType = record.isFast() ? 'Fast' : 'Charged';
    return moveName + ' (' + type + ') - ' + moveType;
  }
}

class PokemonCombo extends ComboBox {
  constructor(config) {
    super($.extend({
      fieldLabel : 'Pokemon',
      store : 'pokemonStore',
      dictionary : 'pokemonDictionary',
      valueField : 'id',
      displayField : 'name'
    }, config));
  }

  lookupText(key, record, dictionary) {
    var index = '#' + ('000' + record.index).slice(-3);
    var pokemonName = super.lookupText(formatId('pokemon_name', record.index));
    return index + ' ' + pokemonName;
  }
}

const language = 'English';
class PokemonApp extends Application {
  constructor(config) {
    super($.extend({
      title : 'Pokemon GO Application',
      language : language,
      stores : {
        moveStore : new MoveStore(),
        pokemonStore : new PokemonStore(),
        moveDictionary : new MoveDictionary(language),
        pokemonDictionary : new PokemonDictionary(language),
        generalDictionary : new GeneralDictionary()
      }
    }, config));
  }
  
  initialize() {
    var me = this;
    // Add listeners
    $(document).bind('PokemonComboChangedEvent', function(e, combo, value) {
      //var viewport = me.viewport;
      //var pokemonCombo = viewport.items[0];
      //var pokemonStore = pokemonCombo.store;
      //var pokemonData = pokemonStore.retrieveById(value)[0];
      
      var pokemonStore = me.stores['pokemonStore'];
      var moveStore = me.stores['moveStore'];
      var pokemonDictionary = me.stores['pokemonDictionary'];
      var moveDictionary = me.stores['moveDictionary'];
      var generalDictionary = me.stores['generalDictionary'];
      
      var pokemonData = pokemonStore.retrieveById(value)[0];
      var index = pokemonData.index;
      
      var exportData = {
        name : pokemonDictionary.lookup(formatId('pokemon_name', index)),
        category : pokemonDictionary.lookup(formatId('pokemon_category', index)),
        description : pokemonDictionary.lookup(formatId('pokemon_desc', index)),
        fastAttacks : pokemonData.fastAttacks.map(name => formatAttack(name, moveStore, moveDictionary, generalDictionary)),
        chargedAttacks : pokemonData.chargedAttacks.map(name => formatAttack(name, moveStore, moveDictionary, generalDictionary))
      };

      console.log(JSON.stringify(exportData, null, 2));
    });
    $(document).bind('MovesComboChangedEvent', function(e, combo, value) {
      console.log(value);
    });
  
    this.viewport.items.forEach(item => item.reload());
  }
};

var pokemonApp = new PokemonApp();
pokemonApp.viewport = new Viewport({
  title : 'Pokemon GO Learnsets',
  parent : pokemonApp,
  width: '80%',
  items : [{
    type : PokemonCombo,
    reference : 'pokemonCombo'
  }, {
    type : MovesCombo,
    reference : 'movesCombo'
  }]
});
pokemonApp.launch(); // Launch the application
