
Inventory = require 'inventory'
InventoryWindow = require 'inventory-window'
ItemPile = require 'itempile'
ModalDialog = require 'voxel-modal-dialog'

module.exports = (game, opts) ->
  new InventoryCrafting(game, opts)

module.exports.pluginInfo =
  'loadAfter': ['voxel-recipes', 'voxel-carry', 'voxel-registry']

class InventoryCrafting extends ModalDialog
  constructor: (@game, opts) ->
    return if not @game.isClient # TODO: server

    @playerInventory = game.plugins?.get('voxel-carry')?.inventory ? opts.playerInventory ? throw new Error('voxel-inventory-dialog requires "voxel-carry" plugin or playerInventory" set to inventory instance')
    @recipes = game.plugins?.get('voxel-recipes') ? throw new Error('voxel-inventory-dialog requires "voxel-recipes" plugin')
    @registry = game.plugins?.get('voxel-registry') ? throw new Error('voxel-inventory-dialog requires "voxel-registry" plugin')

    @playerIW = new InventoryWindow {inventory:@playerInventory, registry:@registry}

    @craftInventory = new Inventory(2, 2)
    @craftInventory.on 'changed', () => @updateCraftingRecipe()
    @craftIW = new InventoryWindow {inventory:@craftInventory, registry:@registry, linkedInventory:@playerInventory}

    @resultInventory = new Inventory(1)
    @resultIW = new InventoryWindow {inventory:@resultInventory, registry:@registry, allowDrop:false, linkedInventory:@playerInventory}
    @resultIW.on 'pickup', () => @tookCraftingOutput()

    # crafting + result div, upper
    crDiv = document.createElement('div')
    crDiv.style.float = 'right'
    crDiv.style.marginBottom = '10px'
   
    craftCont = @craftIW.createContainer()

    resultCont = @resultIW.createContainer()
    resultCont.style.marginLeft = '30px'
    resultCont.style.marginTop = '15%'

    crDiv.appendChild(craftCont)
    crDiv.appendChild(resultCont)

    contents = []
    contents.push crDiv
    contents.push document.createElement('br') # TODO: better positioning
    # player inventory at bottom
    contents.push @playerIW.createContainer()

    super game, {
      contents: contents
      escapeKeys:[192, 69] # '`', 'E'
      }

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

