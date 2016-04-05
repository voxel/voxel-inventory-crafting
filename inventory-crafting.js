
Inventory = require 'inventory'
InventoryWindow = require 'inventory-window'
ItemPile = require 'itempile'
InventoryDialog = (require 'voxel-inventory-dialog').InventoryDialog

module.exports = (game, opts) ->
  new InventoryCrafting(game, opts)

module.exports.pluginInfo =
  'loadAfter': ['voxel-recipes', 'voxel-carry', 'voxel-registry']

class InventoryCrafting extends InventoryDialog
  constructor: (@game, opts) ->
    @recipes = game.plugins?.get('voxel-recipes') ? throw new Error('voxel-inventory-crafting requires "voxel-recipes" plugin')
    @registry = game.plugins?.get('voxel-registry') ? throw new Error('voxel-inventory-crafting requires "voxel-registry" plugin')
    playerInventory = game.plugins?.get('voxel-carry')?.inventory ? opts.playerInventory ? throw new Error('voxel-inventory-crafting requires "voxel-carry" plugin')

    @craftInventory = new Inventory(2, 2)
    @craftInventory.on 'changed', () => @updateCraftingRecipe()
    @craftIW = new InventoryWindow {inventory:@craftInventory, registry:@registry, linkedInventory:playerInventory}

    @resultInventory = new Inventory(1)
    @resultIW = new InventoryWindow {inventory:@resultInventory, registry:@registry, allowDrop:false, linkedInventory:playerInventory}
    @resultIW.on 'pickup', () => @tookCraftingOutput()

    # crafting + result div, add to upper from InventoryDialog
    craftCont = @craftIW.createContainer()

    craftContOuter = document.createElement 'div'  # so craftCont can float left
    craftContOuter.appendChild craftCont

    resultCont = @resultIW.createContainer()
    resultCont.style.display = 'flex'
    resultCont.style.flexFlow = 'column'
    resultCont.style.justifyContent = 'center'
    resultCont.style.marginLeft = '30px'

    outer = document.createElement 'div'
    outer.style.display = 'flex'
    outer.style.float = 'right'
    outer.style.margin = '30px'

    outer.appendChild craftContOuter
    outer.appendChild resultCont

    super game,
      upper: [outer]

  enable: () ->

  disable: () ->

  # changed crafting grid, so update recipe output
  updateCraftingRecipe: () ->
    recipe = @recipes.find(@craftInventory)
    console.log 'found recipe',recipe
    @resultInventory.set 0, recipe?.computeOutput(@craftInventory)

  # picked up crafting recipe output, so consume crafting grid ingredients
  tookCraftingOutput: () ->
    recipe = @recipes.find(@craftInventory)
    return if not recipe?

    recipe.craft(@craftInventory)
    @craftInventory.changed()

