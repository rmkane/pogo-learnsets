class MovesCombo extends ComboBox {
  constructor(config) {
    super($.extend({
      fieldLabel : 'Moves',
      store : 'moveStore',
      dictionary : 'moveDictionary',
      valueField : 'id',
      displayField : 'name'
    }, config));
  }

  lookupText(key, record) {
    var moveName = super.lookupText('move_name_' + ('0000' + record.index).slice(-4));
    var moveType = record.isFast() ? 'Fast' : 'Charged';
    return moveName + ' (' + moveType + ' - ' + record.type + ')';
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

  lookupText(key, record) {
    var index = '#' + ('000' + record.index).slice(-3);
    var pokemonName = super.lookupText('pokemon_name_' + ('0000' + record.index).slice(-4));
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
        pokemonDictionary : new PokemonDictionary(language)
      }
    }, config));
  }
  
  initialize() {
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
