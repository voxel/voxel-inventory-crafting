'use strict';

const Inventory = require('inventory');
const InventoryWindow = require('inventory-window');
const ItemPile = require('itempile');
const InventoryDialog = require('voxel-inventory-dialog').InventoryDialog;

module.exports = (game, opts) => new InventoryCrafting(game, opts);

module.exports.pluginInfo = {
  'loadAfter': ['voxel-recipes', 'voxel-carry', 'voxel-registry']
};

class InventoryCrafting extends InventoryDialog {
  constructor(game, opts) {

    const recipes = game.plugins.get('voxel-recipes');
    if (!recipes) throw new Error('voxel-inventory-crafting requires "voxel-recipes" plugin')

    const registry = game.plugins.get('voxel-registry');
    if (!registry) throw new Error('voxel-inventory-crafting requires "voxel-registry" plugin')

    const playerInventory = game.plugins.get('voxel-carry').inventory || opts.playerInventory; // TODO: proper error if voxel-carry missing
    if (!playerInventory) throw new Error('voxel-inventory-dialog requires "voxel-carry" plugin or playerInventory" set to inventory instance');


    const craftInventory = new Inventory(2, 2);
    craftInventory.on( 'changed', () => this.updateCraftingRecipe());
    const craftIW = new InventoryWindow({inventory:craftInventory, registry:registry, linkedInventory:playerInventory});

    const resultInventory = new Inventory(1);
    const resultIW = new InventoryWindow({inventory:resultInventory, registry:registry, allowDrop:false, linkedInventory:playerInventory});
    resultIW.on('pickup', () => this.tookCraftingOutput());

    // crafting + result div, add to upper from InventoryDialog
    const craftCont = craftIW.createContainer();

    const craftContOuter = document.createElement('div');  // so craftCont can float left
    craftContOuter.appendChild(craftCont);

    const resultCont = resultIW.createContainer();
    resultCont.style.display = 'flex';
    resultCont.style.flexFlow = 'column';
    resultCont.style.justifyContent = 'center';
    resultCont.style.marginLeft = '30px';

    const outer = document.createElement('div');
    outer.style.display = 'flex';
    outer.style.float = 'right';
    outer.style.margin = '30px';

    outer.appendChild(craftContOuter);
    outer.appendChild(resultCont);

    super(game, {
      upper: [outer]
    });

    this.game = game;
    this.recipes = recipes;
    this.registry = registry;
    this.craftInventory = craftInventory;
    this.craftIW = craftIW;
    this.resultInventory = resultInventory;
    this.resultIW = resultIW;
  }

  enable() {
  }

  disable() {
  }

  // changed crafting grid, so update recipe output
  updateCraftingRecipe() {
    const recipe = this.recipes.find(this.craftInventory);
    console.log('found recipe',recipe);
    this.resultInventory.set(0, recipe !== undefined ? recipe.computeOutput(this.craftInventory) : undefined);
  }

  // picked up crafting recipe output, so consume crafting grid ingredients
  tookCraftingOutput() {
    const recipe = this.recipes.find(this.craftInventory);
    if (recipe === undefined) return;

    recipe.craft(this.craftInventory);
    this.craftInventory.changed();
  }
}

