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
      valueField : 'id',
      dictionary : [ 'moveDictionary', 'generalDictionary' ],
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

class Separator extends HtmlComponent {
  constructor(config) {
     super($('<hr>'), config);
     config = config || {};
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

class OutputArea extends TextArea {
  constructor(config) {
    super($.extend({
      fieldLabel : 'Output',
      maxHeightPercent : 0.667,
      placeholder : 'Data...'
    }, config));
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
        genderStore : new GenderStore(),
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
      var genderStore = me.stores['genderStore'];
      var pokemonDictionary = me.stores['pokemonDictionary'];
      var moveDictionary = me.stores['moveDictionary'];
      var generalDictionary = me.stores['generalDictionary'];
      
      var pokemonData = pokemonStore.retrieveById(value)[0];
      var index = pokemonData.index;
      var types = [ pokemonData.type1, pokemonData.type2 ].filter(x => x != null).map(type => generalDictionary.lookup(type.toLowerCase()));
      var weaknesses = getWeaknesses(types);

      var prevPokemon = pokemonStore.retrieveByIndex(index - 1)[0];
      var nextPokemon = pokemonStore.retrieveByIndex(index + 1)[0];
      var familyPokemon = pokemonStore.retrieveByName(pokemonData.family.replace('FAMILY_', ''), true)[0];
      var evolutionPokemon = pokemonData.evolution ? pokemonStore.retrieveByName(pokemonData.evolution, true)[0] : null;

      var genderData = genderStore.retrieveByIndex(index)[0];
      var genders = {};
      if (genderData.genderlessPercent > 0) {
        genders['genderless'] = genderData.genderlessPercent;
      } else {
        genders['male'] = genderData.malePercent;
        genders['female'] = genderData.femalePercent;
      }
      
      var exportData = {
        index : index,
        name : pokemonDictionary.lookup(formatId('pokemon_name', index)),
        types : types,
        category : pokemonDictionary.lookup(formatId('pokemon_category', index)),
        description : pokemonDictionary.lookup(formatId('pokemon_desc', index)),
        fastAttacks : pokemonData.fastAttacks.map(name => formatAttack(name, moveStore, moveDictionary, generalDictionary)),
        chargedAttacks : pokemonData.chargedAttacks.map(name => formatAttack(name, moveStore, moveDictionary, generalDictionary)),
        height : parseFloat(pokemonData.height),
        weight : parseFloat(pokemonData.weight),
        stamina : parseInt(pokemonData.stamina, 10),
        attack : parseInt(pokemonData.attack),
        defense : parseInt(pokemonData.defense),
        fleeRate : parseFloat(pokemonData.fleeRate),
        captureRate : parseFloat(pokemonData.captureRate),
        prevPokemonIndex : prevPokemon.index,
        prevPokemonName : pokemonDictionary.lookup(formatId('pokemon_name', prevPokemon.index)),
        nextPokemonIndex : nextPokemon.index,
        nextPokemonName : pokemonDictionary.lookup(formatId('pokemon_name', nextPokemon.index)),
        weaknesses : weaknesses,
        family : pokemonDictionary.lookup(formatId('pokemon_name', familyPokemon.index)),
        evolution : evolutionPokemon ? pokemonDictionary.lookup(formatId('pokemon_name', evolutionPokemon.index)) : 'NULL',
        candyCost : pokemonData.candyCost,
        genders : genders
      };

      var jsonExport = JSON.stringify(exportData, null, 2);
      var outputField = me.viewport.lookupComponent('output');
      var wikiExport = jsonToWiki(exportData);

      console.log(jsonExport);
      outputField.setValue(wikiExport);
    });
    $(document).bind('MovesComboChangedEvent', function(e, combo, value) {
      var outputField = me.viewport.lookupComponent('output');
      
      var pokemonStore = me.stores['pokemonStore'];
      var moveStore = me.stores['moveStore'];
      var pokemonDictionary = me.stores['pokemonDictionary'];
      var moveDictionary = me.stores['moveDictionary'];
      var generalDictionary = me.stores['generalDictionary'];
      
      var moveData = moveStore.retrieveById(value)[0];
      var index = moveStore.index;
      var moveType = generalDictionary.lookup(moveData.type.toLowerCase());
      var moveIsFast = moveData.isFast() ? 'Fast' : 'Charged';
      
      var pokemonWithAttack = pokemonStore.records.reduce((result, pokemon) => {
        var hasMove = pokemon.fastAttacks.concat(pokemon.chargedAttacks).some(attack => {
          return moveData.id.indexOf(attack) > -1;
        });
        if (hasMove) {
          result.push(pokemon);
        }
        return result;
      }, []);
     
      var pageData = [
        '{{Infobox Moves',
        ' | title3        = ' + (moveDictionary.lookup(formatId('move_name', moveData.index)) || moveData.name),
        ' | use           = ' + moveIsFast,
        ' | type          = ' + moveType,
        ' | attack_power  = ' + moveData.power,
        ' | specialgauge  = ' + (!moveData.isFast() ? Math.abs(Math.ceil(100 / moveData.energy)) : ''),
        ' | energy        = ' + (moveData.isFast() ? moveData.energy : ''),
        ' | cooldown      = ' + moveData.calculateCooldown().toFixed(2),
        ' | dps           = ' + moveData.calculateDamagePerSecond().toFixed(2),
        ' | eps           = ' + moveData.calculateEnergyPerSecond().toFixed(2),
        '}}',
        '==Pokémon with attack==',
        '{| class="article-table"',
        '! # !! Name !! Type 1 !! Type 2',
        '|-',
        (pokemonWithAttack.length > 0 ? pokemonWithAttack.map(pokemon => {
          return '| {{Move learn|' + pokemonDictionary.lookup(formatId('pokemon_name', pokemon.index)) + '}}';
        }).join('\n|-\n') : '| colspan="4" align="center" | \'\'None\'\''),
        '|}',
        '',
        '==Super-effective against==',
        '<dpl>category=Weak to ' + moveType + '</dpl>',
        '',
        '[[Category:Attacks]]',
        '[[Category:' + moveIsFast + ' attacks]]'
      ].join('\n');
      
      var allMoves = [[
        'id',
        'name',
        'type',
        'power',
        'dps',
        'eps',
        'is_fast',
      ].join('\t')].concat(moveStore.records.map(record => {
        return [
          record.index,
          moveDictionary.lookup(formatId('move_name', record.index)) || record.name,
          generalDictionary.lookup(record.type.toLowerCase()),
          record.power,
          record.calculateDamagePerSecond(),
          record.calculateEnergyPerSecond(),
          record.isFast()
        ].join('\t');
      })).join('\n');
      
      outputField.setValue(pageData);
    });
  
    this.viewport.items.forEach(item => item.reload());
  }
};

function jsonToWiki(jsonData) {
  return pokemonWikiTemplate(jsonData).replace(/\\([{}])/g, '$1').replace(/&#x27;/g, "'").replace(/&#x3D;/g, '=').replace(/\bPokemon\b/g, 'Pokémon').replace(/\bPokedex\b/g, 'Pokédex');
}

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
  }, {
    type : Separator,
    reference : 'sparator'
  }, {
    type : OutputArea,
    reference : 'output'
  }]
});
pokemonApp.launch(); // Launch the application
