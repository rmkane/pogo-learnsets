/** ============================= Main ====================================== */

$(document).bind('MoveStoreLoadedEvent', onMoveStoreLoaded);
$(document).bind('PokemonStoreLoadedEvent', onPokemonStoreLoaded);
$(document).bind('MoveDictionaryLoadedEvent', onMoveDictionaryLoaded);
$(document).bind('PokemonDictionaryLoadedEvent', onPokemonDictionaryLoaded);

var stores = {
  moveStore : new MoveStore(),
  pokemonStore : new PokemonStore(),
  moveDictionary : new MoveDictionary(),
  pokemonDictionary : new PokemonDictionary()
};

class MovesCombo extends ComboBox {
  constructor(config) {
    super($.extend({
      fieldLabel : 'Moves',
      store : stores.moveStore,
      dictionary : stores.moveDictionary,
      valueField : 'id',
      displayField : 'name'
    }, config));
  }

  lookupText(key, record) {
    return super.lookupText('move_name_' + ('0000' + record.index).slice(-4));
  }
}

class PokemonCombo extends ComboBox {
  constructor(config) {
    super($.extend({
      fieldLabel : 'Pokemon',
      store : stores.pokemonStore,
      dictionary : stores.pokemonDictionary,
      valueField : 'id',
      displayField : 'name'
    }, config));
  }

  lookupText(key, record) {
    return super.lookupText('pokemon_name_' + ('0000' + record.index).slice(-4));
  }
}

function areStoresLoaded() {
  return Object.keys(stores).every(name => stores[name].isLoaded());
}

function onMoveStoreLoaded(e) {
  var moveName = 'RAZOR_LEAF';
  var foundMove = stores.moveStore.retrieveByName(moveName, true);
  console.log(foundMove);
  
  if (areStoresLoaded()) initialize(); // Wait for all stores to load...
}

function onPokemonStoreLoaded(e) {
  var pokemonName = 'SCYTHER';
  var foundPokemon = stores.pokemonStore.retrieveByName(pokemonName);
  console.log(foundPokemon);
  
  if (areStoresLoaded()) initialize(); // Wait for all stores to load...
}

function onMoveDictionaryLoaded() {
  console.log(stores.moveDictionary);
  
  if (areStoresLoaded()) initialize(); // Wait for all stores to load...
}

function onPokemonDictionaryLoaded() {
  console.log(stores.pokemonDictionary);
  
  if (areStoresLoaded()) initialize(); // Wait for all stores to load...
}

function initialize() {
  console.log('INITIALIZING...');
  var pokemonName = 'SCYTHER';
  var pokemon = stores.pokemonStore.retrieveByName(pokemonName)[0];
  var chargedAttackNames = pokemon.chargedAttacks;
  var chargedAttacks = chargedAttackNames.map(attackName => stores.moveStore.retrieveByName(attackName, true)[0]);
  var chargedAttacksDisp = chargedAttacks.map(attack => stores.moveDictionary.lookup('move_name_' + ('0000' + attack.index).slice(-4)))
  console.log(chargedAttacksDisp);
  
  var pokemonApp = new Application({
    name : 'Pokemon GO Application',
    stores : {
      moveStore : MoveStore,
      pokemonStore : PokemonStore,
      moveDictionary : MoveDictionary,
      pokemonDictionary : PokemonDictionary
    },
    viewport : new Viewport({
      title : 'Pokemon GO Learnsets',
      width: '80%',
      items : [{
        type : PokemonCombo,
        reference : 'pokemonCombo'
      }, {
        type : MovesCombo,
        reference : 'movesCombo'
      }]
    })
  });

  pokemonApp.launch(); // Launch the application
}