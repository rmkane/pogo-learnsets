class MoveStore extends JsonStore {
  constructor() {
    super({
      url : "assets/data/GAME_MASTER.json",
      rootProperty : 'itemTemplates',
      model : Move,
      autoLoad : true,
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

class MoveTextStore extends TextStore {
  constructor() {
    super({
      url : "assets/language/moves.txt",
    });
  }
}

class PokemonTextStore extends TextStore {
  constructor() {
    super({
      url : "assets/language/pokemon.txt",
    });
  }
}

/** ============================= Main ====================================== */

$(document).bind('MoveStoreLoadedEvent', onMoveStoreLoaded);
$(document).bind('PokemonStoreLoadedEvent', onPokemonStoreLoaded);
$(document).bind('MoveTextStoreLoadedEvent', onMoveTextStoreLoaded);
$(document).bind('PokemonTextStoreLoadedEvent', onPokemonTextStoreLoaded);

var stores = {
  moveStore : new MoveStore(),
  pokemonStore : new PokemonStore(),
  moveTextStore : new MoveTextStore(),
  pokemonTextStore : new PokemonTextStore()
};

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

function onMoveTextStoreLoaded() {
  console.log(stores.moveTextStore.retrieveAll());
  
  if (areStoresLoaded()) initialize(); // Wait for all stores to load...
}

function onPokemonTextStoreLoaded() {
  console.log(stores.pokemonTextStore.retrieveAll());
  
  if (areStoresLoaded()) initialize(); // Wait for all stores to load...
}

function initialize() {
  console.log('INITIALIZING...');

  var pokemonName = 'SCYTHER';
  var pokemon = stores.pokemonStore.retrieveByName(pokemonName)[0];
  var chargedAttackNames = pokemon.chargedAttacks;
  var chargedAttacks = chargedAttackNames.map(attack => stores.moveStore.retrieveByName(attack)[0]).map(attack => stores.moveTextStore.retrieveById(attack.index)[0].value);
  console.log(chargedAttacks);

  var pokemonCombo = new ComboBox({
    fieldLabel : 'Pokemon',
    store : stores.pokemonStore,
    valueField : 'id',
    displayField : 'name'
  });
  $('#app-form').append(pokemonCombo.getComponent());
  
  var movesCombo = new ComboBox({
    fieldLabel : 'Moves',
    store : stores.moveStore,
    valueField : 'id',
    displayField : 'name'
  });
  $('#app-form').append(movesCombo.getComponent());
}
