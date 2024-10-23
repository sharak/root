import { configSheet } from './helpers/config-sheet.mjs'
import { RootTraitsModel } from './helpers/traits-sheet.mjs'
import { RootUtility } from './helpers/utility.mjs'

// Once the game has initialized, set up the Root module.
Hooks.once('init', () => {
  // Register Root settings.
  game.settings.register('root', 'automate', {
    name: game.i18n.localize('Root.Settings.Automate.Title'),
    default: true,
    type: Boolean,
    scope: 'world',
    config: true,
    hint: game.i18n.localize('Root.Settings.Automate.Hint'),
    requiresReload: true,
  })

  game.settings.register('root', 'load', {
    name: game.i18n.localize('Root.Settings.Load.Title'),
    default: true,
    type: Boolean,
    scope: 'world',
    config: true,
    hint: game.i18n.localize('Root.Settings.Load.Hint'),
    requiresReload: true,
  })

  game.settings.register('root', 'masteries', {
    name: game.i18n.localize('Root.Settings.Masteries.Title'),
    default: false,
    type: Boolean,
    scope: 'world',
    config: true,
    hint: game.i18n.localize('Root.Settings.Masteries.Hint'),
    requiresReload: true,
  })

  game.settings.register('root', 'advantage', {
    name: game.i18n.localize('Root.Settings.Advantage.Title'),
    default: false,
    type: Boolean,
    scope: 'world',
    config: true,
    hint: game.i18n.localize('Root.Settings.Advantage.Hint'),
    requiresReload: true,
  })
})

// Add Traits sheet and data model
Hooks.on('init', () => {
  Object.assign(CONFIG.Item.dataModels, {
    'root.traits': RootTraitsModel,
  })

  // Extend PbtA item sheets and change template path
  class RootTraitsSheet extends game.pbta.applications.item.PbtaItemSheet {
    get template() {
      return `/modules/root/templates/traits-sheet.hbs`
    }

    async getData(options = {}) {
      const context = await super.getData(options)
      context.description = await TextEditor.enrichHTML(this.object.system.description, {
        async: true,
        secrets: this.object.isOwner,
        relativeTo: this.object,
      })
      return context
    }
  }

  Items.registerSheet('root', RootTraitsSheet, {
    types: ['root.traits'],
    makeDefault: true,
  })

  // Change Class method to override Triumph outcome in Mastery moves.
  CONFIG.Dice.RollPbtA.prototype.toMessage = async function (
    messageData = {},
    { rollMode, create = true } = {},
  ) {
    // Perform the roll, if it has not yet been rolled
    if (!this._evaluated) {
      await this.evaluate()
    }

    const resultRanges = game.pbta.sheetConfig.rollResults
    let resultLabel = null
    let resultDetails = null
    let resultType = null
    let stat = this.options.stat
    let statMod

    // Iterate through each result range until we find a match.
    for (const [resultKey, resultRange] of Object.entries(resultRanges)) {
      const { start, end } = resultRange
      if ((!start || this.total >= start) && (!end || this.total <= end)) {
        resultType = resultKey
        break
      }
    }

    this.options.resultType = resultType
    // Update the templateData.
    resultLabel = resultRanges[resultType]?.label ?? resultType
    if (this.data?.moveResults && this.data?.moveResults[resultType]?.value) {
      resultDetails = this.data?.moveResults[resultType].value
    }

    console.log(resultType, resultLabel, resultDetails)

    //! Triumph override for Mastery moves.
    const masteries = await game.settings.get('root', 'masteries')

    if (masteries) {
      try {
        if (this.data?.moveResults.critical.value !== '' && this.total >= '12') {
          resultType = 'critical'
          resultLabel = game.i18n.localize('Root.Sheet.Results.Critical')
          resultDetails = this.data?.moveResults.critical.value
        }
      } catch (error) {
        console.log('Stat roll was used and it has no Triumph description.', error)
      }
    }

    // Add the stat label.
    if (stat && this.data.stats[stat]) {
      statMod = this.data.stats[stat].value
      stat = game.pbta.sheetConfig.actorTypes[this.options.sheetType]?.stats[stat]?.label ?? stat
    }

    messageData = foundry.utils.mergeObject(
      {
        formula: this._formula,
        flavor: this.options.flavor,
        user: game.user.id,
        tooltip: await this.getTooltip(),
        total: Math.round(this.total * 100) / 100,
        sound: CONFIG.sounds.dice,
        conditionsConsumed: this.options.conditionsConsumed,
        conditions: this.options.conditions,
        choices: await TextEditor.enrichHTML(this.options.choices),
        details: await TextEditor.enrichHTML(this.options.details),
        originalMod: this.options.originalMod,
        result: resultType,
        resultDetails: await TextEditor.enrichHTML(resultDetails),
        resultLabel,
        resultRanges,
        stat,
        statMod,
        title: this.options.title,
        rolls: [this],
      },
      messageData,
    )
    // These are abominations from the refactoring but I couldn't figure out how to merge everything into a single ChatMessage.create call
    // messageData.rollPbta = await this.render();
    messageData.content = await renderTemplate(
      'systems/pbta/templates/chat/chat-move.html',
      messageData,
    )

    // Either create the message or just return the chat data
    const cls = getDocumentClass('ChatMessage')
    // eslint-disable-next-line new-cap
    const msg = new cls(messageData)

    // Either create or return the data
    if (create) {
      return cls.create(msg.toObject(), { rollMode })
    } else if (rollMode) {
      msg.applyRollMode(rollMode)
    }
    return msg.toObject()
  }
})

// Override sheetConfig with Root sheet (TOML).
Hooks.once('pbtaSheetConfig', async () => {
  // Disable the sheet config form.
  game.settings.set('pbta', 'sheetConfigOverride', true)

  // Replace the game.pbta.sheetConfig with Root version.
  await configSheet()
})

/* -------------------------------------------- */
/*  Actor Updates                               */
/* -------------------------------------------- */

// Change starting actor image.
Hooks.on('preCreateActor', async function (actor) {
  if (actor.img === 'icons/svg/mystery-man.svg') {
    function random_icon(icons) {
      return icons[Math.floor(Math.random() * icons.length)]
    }

    const icons = ['badger', 'bird', 'boar', 'fox', 'hyena', 'lynx', 'mole', 'monkey', 'raccoon']
    const img = random_icon(icons)
    actor.updateSource({ img: `modules/root/styles/img/icons/${img}.svg` })
  }
})

Hooks.on('preCreateItem', async function (item) {
  if (item.img == 'icons/svg/item-bag.svg') {
    if (item.type == 'equipment') item.updateSource({ img: `icons/svg/combat.svg` })
    else if (item.type == 'root.traits') item.updateSource({ img: `icons/svg/pawprint.svg` })
  }
})

// Load moves and details.
Hooks.on('createActor', async (actor, options, id) => {
  // Prepare updates object.
  const updates = {}

  if (actor.type == 'character') {
    // Get the item moves as the priority.
    const moves = game.items.filter(
      (i) => i.type === 'move' && ['weapon-basic', 'other'].includes(i.system.moveType),
    )
    const compendium = await RootUtility.loadCompendia(['weapon-basic', 'other'])
    let actorMoves = []

    actorMoves = actor.items.filter((i) => i.type == 'move')

    // Get the compendium moves next.
    const moves_compendium = compendium.filter((m) => {
      const notTaken = actorMoves.filter((i) => i.name == m.name)
      return notTaken.length < 1
    })
    // Append compendium moves to the item moves.
    const moves_list = moves.map((m) => {
      return m.name
    })
    for (const move of moves_compendium) {
      if (!moves_list.includes(move.name)) {
        moves.push(move)
        moves_list.push(move.name)
      }
    }

    // Add template for background.
    updates['system.details.biography.value'] = game.i18n.localize('Root.Background.CustomTemplate')

    // Add to the actor.
    const movesToAdd = moves.map((m) => duplicate(m))

    // Only execute the function once.
    const owners = []
    Object.entries(actor.permission).forEach(([uid, role]) => {
      // @todo unhardcode this role ID (owner).
      if (role == 3) owners.push(uid)
    })
    const isOwner = owners.includes(game.user.id)
    // @todo improve this to better handle multiple GMs/owers.
    const allowMoveAdd =
      game.user.isGM ||
      (isOwner &&
        game.users.filter((u) => u.role == CONST.USER_ROLES.GAMEMASTER && u.document.active)
          .length < 1)

    // If there are moves and we haven't already add them, add them.
    if (movesToAdd.length > 0 && allowMoveAdd) {
      await actor.createEmbeddedDocuments('Item', movesToAdd, {})
      // Sort moves alphabetically
      let sortedMoves = []
      for (const itemType of Object.values(actor.itemTypes)) {
        sortedMoves = sortedMoves.concat(
          itemType
            .sort((a, b) => {
              return a.name.localeCompare(b.name)
            })
            .map((item, i) => ({ _id: item.id, sort: 100000 + i * 100000 })),
        )
      }
      await actor.updateEmbeddedDocuments('Item', sortedMoves)
    }
  }

  // Perform updates, if any.
  if (updates && Object.keys(updates).length > 0) {
    await actor.update(updates)
  }
})

// Make changes to item sheets
Hooks.on('renderItemSheet', async function (app, html, data) {
  const item = app.object

  // Find if item is move
  if (item.type == 'move') {
    // Show Triumph description in move sheet if Masteries Rule enabled.
    const masteries = game.settings.get('root', 'masteries')
    const resources = html.find('div[data-tab="description"] div.move-result')
    const triumph = resources[0]
    const triumphLabel = triumph.querySelector('label')
    const triumphInstructions = game.i18n.localize('Root.Sheet.Instructions.Triumph')
    const strongHit = resources[1]
    const strongHitLabel = strongHit.querySelector('label')
    const strongHitInstructions = game.i18n.localize('Root.Sheet.Instructions.StrongHit')

    if (!masteries) {
      triumph.style.display = 'none'
    } else {
      triumphLabel.innerHTML += `<br> <span style="font-weight: normal; font-style: italic; font-size: 13px;">${triumphInstructions}</span>`
      strongHitLabel.innerHTML += `<br> <span style="font-weight: normal; font-style: italic; font-size: 13px;">${strongHitInstructions}</span>`
    }

    // Show automate options
    const automate = game.settings.get('root', 'automate')
    if (automate) {
      const moveGroup = html.find('input[name="system.moveGroup"]')
      const resource = moveGroup.closest('div.resource')
      const automationValue = item.getFlag('root', 'automationValue') || 0
      const automationStat = item.getFlag('root', 'automationStat') || 'none'
      const charmLabel = game.i18n.localize('Root.Sheet.Stats.Charm')
      const cunningLabel = game.i18n.localize('Root.Sheet.Stats.Cunning')
      const finesseLabel = game.i18n.localize('Root.Sheet.Stats.Finesse')
      const luckLabel = game.i18n.localize('Root.Sheet.Stats.Luck')
      const mightLabel = game.i18n.localize('Root.Sheet.Stats.Might')
      const injuryLabel = game.i18n.localize('Root.Sheet.NPC.Injury')
      const exhaustionLabel = game.i18n.localize('Root.Sheet.NPC.Exhaustion')
      const depletionLabel = game.i18n.localize('Root.Sheet.NPC.Depletion')
      const automationLabel = game.i18n.localize('Root.Sheet.Traits.Automation')

      const automateHTML = `
    <div class="resource">
        <label>${automationLabel}</label>
        <p><i class="fa-solid fa-plus"></i><input type="text" name="flags.root.automationValue" value="${automationValue}" data-dtype="Number" style="text-align: center; width: 30px;">
        <select name="flags.root.automationStat" id="flags.root.automationStat" data-dType="String">
            <option value="none"${automationStat === 'none' ? ' selected' : ''}>---</option>
            <option value="charm"${automationStat === 'charm' ? ' selected' : ''}>${charmLabel}</option>
            <option value="cunning"${automationStat === 'cunning' ? ' selected' : ''}>${cunningLabel}</option>
            <option value="finesse"${automationStat === 'finesse' ? ' selected' : ''}>${finesseLabel}</option>
            <option value="luck"${automationStat === 'luck' ? ' selected' : ''}>${luckLabel}</option>
            <option value="might"${automationStat === 'might' ? ' selected' : ''}>${mightLabel}</option>
            <option value="injury"${automationStat === 'injury' ? ' selected' : ''}>${injuryLabel}</option>
            <option value="exhaustion"${automationStat === 'exhaustion' ? ' selected' : ''}>${exhaustionLabel}</option>
            <option value="depletion"${automationStat === 'depletion' ? ' selected' : ''}>${depletionLabel}</option>
        </select>
        </p>
    </div>
`
      resource.after(automateHTML)
    }
  }

  // Find if item is move
  if (item.type == 'equipment') {
    // HANDLE TAGS
    try {
      // Find tags and sort ranges first
      const tagsJson = item.system.tags
      if (tagsJson) {
        const tagsData = JSON.parse(tagsJson)
        const desiredValues = ['intimate', 'close', 'far']

        function customSort(a, b) {
          const indexA = desiredValues.indexOf(a.value)
          const indexB = desiredValues.indexOf(b.value)
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB
          }
          if (indexA !== -1) {
            return -1
          } else if (indexB !== -1) {
            return 1
          }
          return 0
        }

        const sortedData = tagsData.sort(customSort)
        const updatedTagsJson = JSON.stringify(sortedData)
        // Update new tags order
        await item.update({ [`system.tags`]: updatedTagsJson })
      }
    } catch (error) {
      console.log('No tags yet', error)
    }

    // Render tag when clicked on item sheet
    const tag = html.find('tags tag')

    tag.click(async function (e) {
      const name = e.target.innerText
      // Retrieve tags in game and then in compendium
      let tagItems = game.items.filter((i) => i.type == 'tag')
      const pack = game.packs.get('root.tags')
      const items = pack ? await pack.getDocuments() : []
      tagItems = tagItems.concat(items.filter((i) => i.type == 'tag'))
      // Remove tag repeats by matching names in new array.
      const tagNames = []
      for (const t of tagItems) {
        const tagName = t.name
        if (tagNames.includes(tagName) !== false) {
          tagItems = tagItems.filter((item) => item.id != t.id)
        } else {
          tagNames.push(tagName)
        }
      }
      // Render tag
      for (const tagItem of tagItems) {
        if (tagItem.name.toLowerCase() == name) {
          tagItem.sheet.render(true)
        }
      }
    })

    // Include item wear
    const uses = html.find('input[name="system.uses"]')
    const usesDiv = uses.closest('div.form-group')
    let addWearOne = item.getFlag('root', 'itemWear.addBox1') || false
    const wearOne = item.getFlag('root', 'itemWear.box1') || false
    let addWearTwo = item.getFlag('root', 'itemWear.addBox2') || false
    const wearTwo = item.getFlag('root', 'itemWear.box2') || false
    let addWearThree = item.getFlag('root', 'itemWear.addBox3') || false
    const wearThree = item.getFlag('root', 'itemWear.box3') || false
    let addWearFour = item.getFlag('root', 'itemWear.addBox4') || false
    const wearFour = item.getFlag('root', 'itemWear.box4') || false
    let addWearFive = item.getFlag('root', 'itemWear.addBox5') || false
    const wearFive = item.getFlag('root', 'itemWear.box5') || false
    let addWearSix = item.getFlag('root', 'itemWear.addBox6') || false
    const wearSix = item.getFlag('root', 'itemWear.box6') || false
    let addWearSeven = item.getFlag('root', 'itemWear.addBox7') || false
    const wearSeven = item.getFlag('root', 'itemWear.box7') || false
    let addWearEight = item.getFlag('root', 'itemWear.addBox8') || false
    const wearEight = item.getFlag('root', 'itemWear.box8') || false
    const wearLabel = game.i18n.localize('Root.Sheet.Items.Wear')
    const depletionLabel = game.i18n.localize('Root.Sheet.Items.Depletion')

    const wearBoxes = `
    <label>${wearLabel} <i class="wear far fa-plus-square"></i> <i class="wear far fa-minus-square"></i></label>
    <div>
      <input type="checkbox" name="flags.root.itemWear.addBox1" data-dtype="Boolean" ${addWearOne ? 'checked' : ''}>
      <input type="checkbox" name="flags.root.itemWear.box1" data-dtype="Boolean" ${wearOne ? 'checked' : ''}>
      <input type="checkbox" name="flags.root.itemWear.addBox2" data-dtype="Boolean" ${addWearTwo ? 'checked' : ''}>
      <input type="checkbox" name="flags.root.itemWear.box2" data-dtype="Boolean" ${wearTwo ? 'checked' : ''}>
      <input type="checkbox" name="flags.root.itemWear.addBox3" data-dtype="Boolean" ${addWearThree ? 'checked' : ''}>
      <input type="checkbox" name="flags.root.itemWear.box3" data-dtype="Boolean" ${wearThree ? 'checked' : ''}>
      <input type="checkbox" name="flags.root.itemWear.addBox4" data-dtype="Boolean" ${addWearFour ? 'checked' : ''}>
      <input type="checkbox" name="flags.root.itemWear.box4" data-dtype="Boolean" ${wearFour ? 'checked' : ''}>
      <input type="checkbox" name="flags.root.itemWear.addBox5" data-dtype="Boolean" ${addWearFive ? 'checked' : ''}>
      <input type="checkbox" name="flags.root.itemWear.box5" data-dtype="Boolean" ${wearFive ? 'checked' : ''}>
      <input type="checkbox" name="flags.root.itemWear.addBox6" data-dtype="Boolean" ${addWearSix ? 'checked' : ''}>
      <input type="checkbox" name="flags.root.itemWear.box6" data-dtype="Boolean" ${wearSix ? 'checked' : ''}>
      <input type="checkbox" name="flags.root.itemWear.addBox7" data-dtype="Boolean" ${addWearSeven ? 'checked' : ''}>
      <input type="checkbox" name="flags.root.itemWear.box7" data-dtype="Boolean" ${wearSeven ? 'checked' : ''}>
      <input type="checkbox" name="flags.root.itemWear.addBox8" data-dtype="Boolean" ${addWearEight ? 'checked' : ''}>
      <input type="checkbox" name="flags.root.itemWear.box8" data-dtype="Boolean" ${wearEight ? 'checked' : ''}>
    </div>`
    usesDiv[0].innerHTML = wearBoxes
    const itemFaPlus = html.find('.wear.fa-plus-square')
    const itemFaMinus = html.find('.wear.fa-minus-square')

    itemFaPlus.click(async function (event) {
      if (addWearOne == false) {
        addWearOne = await item.setFlag('root', 'itemWear.addBox1', true)
      } else if (addWearTwo == false) {
        addWearTwo = await item.setFlag('root', 'itemWear.addBox2', true)
      } else if (addWearThree == false) {
        addWearThree = await item.setFlag('root', 'itemWear.addBox3', true)
      } else if (addWearFour == false) {
        addWearFour = await item.setFlag('root', 'itemWear.addBox4', true)
      } else if (addWearFive == false) {
        addWearFive = await item.setFlag('root', 'itemWear.addBox5', true)
      } else if (addWearSix == false) {
        addWearSix = await item.setFlag('root', 'itemWear.addBox6', true)
      } else if (addWearSeven == false) {
        addWearSeven = await item.setFlag('root', 'itemWear.addBox7', true)
      } else if (addWearEight == false) {
        addWearEight = await item.setFlag('root', 'itemWear.addBox8', true)
      }
    })

    itemFaMinus.click(async function (event) {
      if (addWearEight == true) {
        addWearEight = await item.setFlag('root', 'itemWear.addBox8', false)
      } else if (addWearSeven == true) {
        addWearSeven = await item.setFlag('root', 'itemWear.addBox7', false)
      } else if (addWearSix == true) {
        addWearSix = await item.setFlag('root', 'itemWear.addBox6', false)
      } else if (addWearFive == true) {
        addWearFive = await item.setFlag('root', 'itemWear.addBox5', false)
      } else if (addWearFour == true) {
        addWearFour = await item.setFlag('root', 'itemWear.addBox4', false)
      } else if (addWearThree == true) {
        addWearThree = await item.setFlag('root', 'itemWear.addBox3', false)
      } else if (addWearTwo == true) {
        addWearTwo = await item.setFlag('root', 'itemWear.addBox2', false)
      } else if (addWearOne == true) {
        addWearOne = await item.setFlag('root', 'itemWear.addBox1', false)
      }
    })

    if (item.system.playbook == 'The Pirate' && item.system.tags.includes('stocked')) {
      const depletionOne = item.getFlag('root', 'itemDepletion.box1') || false
      const depletionTwo = item.getFlag('root', 'itemDepletion.box2') || false
      const depletionBoxes = `<hr><div class="resources"><label>${depletionLabel}</label>
      <br><input type="checkbox" name="flags.root.itemDepletion.box1" data-dtype="Boolean" ${depletionOne ? 'checked' : ''}><input type="checkbox" name="flags.root.itemDepletion.box2" data-dtype="Boolean" ${depletionTwo ? 'checked' : ''}>`
      usesDiv[0].insertAdjacentHTML('beforeend', depletionBoxes)
    }
  }
})

// Handle dropped items in actor sheet
Hooks.on('dropActorSheetData', async (actor, html, item) => {
  const droppedEntity = await fromUuid(item.uuid)
  const itemName = droppedEntity.name
  const uuid = item.uuid
  const newTrait = `<p>@UUID[${uuid}]{${itemName}}</p>`
  const traits = actor.system.attributes

  // Add dropped trait item to correct description in actor sheet
  if (droppedEntity.type === 'root.traits') {
    const traitType = droppedEntity.flags.root.traitType

    if (traitType in traits) {
      const currentValue = traits[traitType].value
      const traitHTML = `${currentValue}${newTrait}`
      const updateKey = `system.attributes.${traitType}.value`
      await actor.update({ [updateKey]: traitHTML })
    }
  }

  // Add points/boxes to stats/resources if automatic stat increment = true
  const automate = game.settings.get('root', 'automate')

  if (automate && droppedEntity.type === 'move') {
    const autoValue = (await droppedEntity.getFlag('root', 'automationValue')) || '0'
    const stat = (await droppedEntity.getFlag('root', 'automationStat')) || 'none'

    if (stat in actor.system.stats) {
      const currentVal = actor.system.stats[stat].value
      const newVal = parseInt(currentVal) + parseInt(autoValue)
      await actor.update({ [`system.stats.${stat}.value`]: newVal })
    } else if (stat === 'injury' || stat === 'exhaustion' || stat === 'depletion') {
      const parsedVal = parseInt(autoValue)
      const resourceOptions = actor.system.attributes.resource.options
      const indicesToReview = [4, 6, 8, 10]
      const optionIndex = stat === 'injury' ? '0' : stat === 'exhaustion' ? '1' : '2'

      let count = 0
      for (const index of indicesToReview) {
        const checkbox = resourceOptions[optionIndex].values[index]

        if (checkbox.value === false) {
          const updateKey = `system.attributes.resource.options.${optionIndex}.values.${index}.value`
          await actor.update({ [updateKey]: true })
          count++
        }

        if (count === parsedVal) {
          break
        }
      }
    }

    setTimeout(() => {
      actor.sheet.render(true)
    }, 100)
  }
})

// Remove points/boxes to stats/resources if automatic stat increment = true
Hooks.on('deleteItem', async (item, options, userId, ...args) => {
  const automate = game.settings.get('root', 'automate')
  const actor = item.parent

  if (automate && item.type === 'move') {
    try {
      const autoValue = item.getFlag('root', 'automationValue') || '0'
      const stat = item.getFlag('root', 'automationStat') || 'none'
      const systemStats = actor.system.stats

      if (stat in systemStats) {
        const currentVal = systemStats[stat].value
        const newVal = parseInt(currentVal) - parseInt(autoValue)
        const updateKey = `system.stats.${stat}.value`
        await actor.update({ [updateKey]: newVal })
      } else if (stat === 'injury' || stat === 'exhaustion' || stat === 'depletion') {
        let count = 0
        const parsedVal = parseInt(autoValue)
        const resourceOptions = actor.system.attributes.resource.options
        const indicesToReview = [4, 6, 8, 10]

        for (const index of indicesToReview) {
          const checkbox =
            resourceOptions[stat === 'injury' ? '0' : stat === 'exhaustion' ? '1' : '2'].values[
              index
            ]

          if (checkbox.value === true) {
            const updateKey = `system.attributes.resource.options.${stat === 'injury' ? '0' : stat === 'exhaustion' ? '1' : '2'}.values.${index}.value`
            await actor.update({ [updateKey]: false })
            count++
          }

          if (count === parsedVal) {
            break
          }
        }
      }

      setTimeout(() => {
        actor.sheet.render(true)
      }, 200)
    } catch (error) {
      console.log('Item not in actor', error)
    }
  }
})

// Add event listeners when actor sheet is rendered.
Hooks.on('renderActorSheet', async function (app, html, data) {
  const actor = app.actor

  // Remove checking when clicking on label
  const labels = html.find(
    '.cell.cell--reputation.cell--attr-reputation.cell--ListMany ul label, .cell.cell--resource.cell--attr-resource.cell--ListMany ul label, .pbta.sheet.npc .cell.cell--attributes-top ul label',
  )

  labels.click(function (event) {
    if ($(event.target).is('input')) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
  })

  // Make checkbox increments behave like clocks
  function handleCheckboxIncrements(checkboxArrays) {
    checkboxArrays.forEach((checkbox, index) => {
      checkbox.change(function () {
        const isChecked = $(this).is(':checked')

        if (isChecked) {
          // Check all the following checkboxes
          checkboxArrays.slice(index + 1).forEach((followingCheckbox) => {
            followingCheckbox.prop('checked', true)
          })
        } else {
          // Uncheck all the preceding checkboxes
          checkboxArrays.slice(0, index).forEach((precedingCheckbox) => {
            precedingCheckbox.prop('checked', false)
          })
        }
      })
    })
  }

  // Render tag when clicked on actor sheet
  const tag = html.find('div.tags div.tag')

  tag.click(async function (e) {
    const name = e.target.innerText
    // Retrieve tags in game and then in compendium
    let tagItems = game.items.filter((i) => i.type == 'tag')
    const pack = game.packs.get('root.tags')
    const items = pack ? await pack.getDocuments() : []
    tagItems = tagItems.concat(items.filter((i) => i.type == 'tag'))
    // Remove tag repeats by matching names in new array.
    const tagNames = []
    for (const t of tagItems) {
      const tagName = t.name
      if (tagNames.includes(tagName) !== false) {
        tagItems = tagItems.filter((item) => item.id != t.id)
      } else {
        tagNames.push(tagName)
      }
    }
    // Render tag
    for (const tagItem of tagItems) {
      if (tagItem.name == name) {
        tagItem.sheet.render(true)
      }
    }
  })

  if (actor.type == 'character') {
    // Calculate load, burdened and max
    const loadCalculate = game.settings.get('root', 'load')

    if (loadCalculate) {
      const carryingInput = html.find('input[name="system.attributes.carrying.value"]')
      carryingInput.attr('readonly', 'readonly')
      let carryingLoad
      const calculateLoad = () => {
        const equipment = actor.items
        const itemsLoad = equipment.reduce((acc, item) => {
          if (item.type === 'equipment') {
            return acc + item.system.weight
          }
          return acc
        }, 0)
        carryingLoad = itemsLoad
      }
      calculateLoad()
      await actor.update({ 'system.attributes.carrying.value': carryingLoad })
      const burdenedInput = html.find('input[name="system.attributes.burdened.value"]')
      burdenedInput.attr('readonly', 'readonly')
      const migthValue = actor.system.stats.might.value
      const burdenedLoad = 4 + migthValue
      await actor.update({ 'system.attributes.burdened.value': burdenedLoad })
      const maxInput = html.find('input[name="system.attributes.max.value"]')
      maxInput.attr('readonly', 'readonly')
      const maxLoad = burdenedLoad * 2
      await actor.update({ 'system.attributes.max.value': maxLoad })
      if (maxInput[0].value != actor.system.attributes.max.value) {
        setTimeout(() => {
          actor.sheet.render(true)
        }, 10)
      }
    }

    /* ----------------------- */
    /*      BACKGROUND         */
    /* ----------------------- */
    // Add background and details
    const backgroundLabel = html.find('div.tab.description label')
    const descriptionEditor = html.find('div.tab.description div.editor')
    const species = (await actor.getFlag('root', 'species')) || ''
    const pronouns = (await actor.getFlag('root', 'pronouns')) || ''
    const looks = (await actor.getFlag('root', 'looks')) || ''
    const oddities = (await actor.getFlag('root', 'oddities')) || ''
    const demeanor = (await actor.getFlag('root', 'demeanor')) || ''
    const home = (await actor.getFlag('root', 'home')) || ''
    const whyVagabond = (await actor.getFlag('root', 'whyVagabond')) || ''
    const leftBehind = (await actor.getFlag('root', 'leftBehind')) || ''
    const lastMaster = (await actor.getFlag('root', 'lastMaster')) || ''
    const loveHistory = (await actor.getFlag('root', 'loveHistory')) || ''
    const captain = (await actor.getFlag('root', 'captain')) || ''
    const fallCause = (await actor.getFlag('root', 'fallCause')) || ''
    const whyExiled = (await actor.getFlag('root', 'whyExiled')) || ''
    const factionExiled = (await actor.getFlag('root', 'factionExiled')) || ''
    const factionLoyalty = (await actor.getFlag('root', 'factionLoyalty')) || ''
    const fundamentalTenets = (await actor.getFlag('root', 'fundamentalTenets')) || ''
    const factionHate = (await actor.getFlag('root', 'factionHate')) || ''
    const factionHarbor = (await actor.getFlag('root', 'factionHarbor')) || ''
    const parentsVagabond = (await actor.getFlag('root', 'parentsVagabond')) || ''
    const parentsHappened = (await actor.getFlag('root', 'parentsHappened')) || ''
    const parentsFactionServed = (await actor.getFlag('root', 'parentsFactionServed')) || ''
    const parentsFactionOppose = (await actor.getFlag('root', 'parentsFactionOppose')) || ''
    const whomWronged = (await actor.getFlag('root', 'whoWronged')) || ''
    const factionServed = (await actor.getFlag('root', 'factionServed')) || ''
    const factionEnmity = (await actor.getFlag('root', 'factionEnmity')) || ''
    const vagabondBackground = (await actor.getFlag('root', 'vagabondBackground')) || 'default'
    const defaultLabel = game.i18n.localize('Root.Background.Default')
    const roninLabel = game.i18n.localize('Root.Background.Ronin')
    const chroniclerLabel = game.i18n.localize('Root.Background.Chronicler')
    const exileLabel = game.i18n.localize('Root.Background.Exile')
    const hereticLabel = game.i18n.localize('Root.Background.Heretic')
    const pirateLabel = game.i18n.localize('Root.Background.Pirate')
    const princeLabel = game.i18n.localize('Root.Background.Prince')
    const raconteurLabel = game.i18n.localize('Root.Background.Raconteur')
    const customLabel = game.i18n.localize('Root.Background.Custom')
    const detailsHeading = game.i18n.localize('Root.Background.Details')
    const speciesHeading = game.i18n.localize('Root.Background.Species')
    const pronounsPlaceholder = game.i18n.localize('Root.Background.Pronouns')
    const looksPlaceholder = game.i18n.localize('Root.Background.Looks')
    const odditiesPlaceholder = game.i18n.localize('Root.Background.Oddities')
    const demeanorHeading = game.i18n.localize('Root.Background.Demeanor')
    const backgroundHeading = game.i18n.localize('Root.Background.Background')
    const factionPlaceholder = game.i18n.localize('Root.Background.Faction')
    const whereIsHomeText = game.i18n.localize('Root.Background.WhereIsHome')
    const whyVagabondText = game.i18n.localize('Root.Background.WhyVagabond')
    const leftBehindText = game.i18n.localize('Root.Background.LeftBehind')
    const lastMasterText = game.i18n.localize('Root.Background.LastMaster')
    const loveHistoryText = game.i18n.localize('Root.Background.LoveHistory')
    const captainText = game.i18n.localize('Root.Background.Captain')
    const fallCauseText = game.i18n.localize('Root.Background.FallCause')
    const whyExiledText = game.i18n.localize('Root.Background.WhyExiled')
    const factionExiledText = game.i18n.localize('Root.Background.FactionExiled')
    const minus2RepText = game.i18n.localize('Root.Background.Minus2Reputation')
    const factionLoyaltyText = game.i18n.localize('Root.Background.FactionLoyalty')
    const plus1RepText = game.i18n.localize('Root.Background.Plus1Reputation')
    const fundamentalTenetsText = game.i18n.localize('Root.Background.FuntamentalTenets')
    const factionHateText = game.i18n.localize('Root.Background.FactionHate')
    const minus1RepText = game.i18n.localize('Root.Background.Minus1Reputation')
    const factionHarborText = game.i18n.localize('Root.Background.FactionHarbor')
    const parentsVagabondText = game.i18n.localize('Root.Background.ParentsVagabond')
    const parentsHappenedText = game.i18n.localize('Root.Background.ParentsHappened')
    const parentsFactionServedText = game.i18n.localize('Root.Background.ParentsFactionServed')
    const parentsFactionOpposeText = game.i18n.localize('Root.Background.ParentsFactionOppose')
    const whomWrongedText = game.i18n.localize('Root.Background.WhomWronged')
    const factionServedText = game.i18n.localize('Root.Background.FactionServed')
    const markPrestigeText = game.i18n.localize('Root.Background.MarkPrestige')
    const factionEnmityText = game.i18n.localize('Root.Background.FactionEnmity')
    const markNotorietyText = game.i18n.localize('Root.Background.MarkNotoriety')

    const vagabondSelect = `<select name="flags.root.vagabondBackground" id="flags.root.vagabondBackground" data-dType="String">
    <option value="default"${vagabondBackground === 'default' ? ' selected' : ''}>${defaultLabel}</option>
    <option value="chronicler"${vagabondBackground === 'chronicler' ? ' selected' : ''}>${chroniclerLabel}</option>
    <option value="exile"${vagabondBackground === 'exile' ? ' selected' : ''}>${exileLabel}</option>
    <option value="heretic"${vagabondBackground === 'heretic' ? ' selected' : ''}>${hereticLabel}</option>
    <option value="pirate"${vagabondBackground === 'pirate' ? ' selected' : ''}>${pirateLabel}</option>
    <option value="prince"${vagabondBackground === 'prince' ? ' selected' : ''}>${princeLabel}</option>
    <option value="raconteur"${vagabondBackground === 'raconteur' ? ' selected' : ''}>${raconteurLabel}</option>
    <option value="ronin"${vagabondBackground === 'ronin' ? ' selected' : ''}>${roninLabel}</option>
    <option value="custom"${vagabondBackground === 'custom' ? ' selected' : ''}>${customLabel}</option>
    </select>
    `

    const detailsHTML = `<h3 style='border: none;'>${speciesHeading}</h3>
    <input style="margin: 0 0 2px; text-align: left; width: 50%;" type="text" name="flags.root.species" value="${species}">
    <hr><h3 style='border: none;'>${detailsHeading}</h3>
    <input style="margin: 0 0 2px; text-align: left; width: 50%;" type="text" name="flags.root.pronouns" value="${pronouns}" placeholder="${pronounsPlaceholder}">
    <input style="margin: 0 0 2px; text-align: left; width: 50%;" type="text" name="flags.root.looks" value="${looks}" placeholder="${looksPlaceholder}">
    <input style="margin: 0 0 2px; text-align: left; width: 50%;" type="text" name="flags.root.oddities" value="${oddities}" placeholder="${odditiesPlaceholder}">
    <hr><h3 style='border: none;'>${demeanorHeading}</h3>
    <input style="margin: 0 0 2px; text-align: left; width: 50%;" type="text" name="flags.root.demeanor" value="${demeanor}">
    <hr><h3 style='border: none;'>${backgroundHeading}</h3>
    `

    const whereIsHomeQuestion = `<h4 style="margin: 8px 0 4px;">${whereIsHomeText}</h4>
    <input style="margin: 0 0 2px; text-align: left; width: 90%;" type="text" name="flags.root.home" value="${home}">
    `
    const whyVagabondQuestion = `<h4 style="margin: 8px 0 4px;">${whyVagabondText}</h4>
    <input style="margin: 0 0 2px; text-align: left; width: 90%;" type="text" name="flags.root.whyVagabond" value="${whyVagabond}">
    `
    const leftBehindQuestion = `<h4 style="margin: 8px 0 4px;">${leftBehindText}</h4>
    <input style="margin: 0 0 2px; text-align: left; width: 90%;" type="text" name="flags.root.leftBehind" value="${leftBehind}">
    `
    const lastMasterQuestion = `<h4 style="margin: 8px 0 4px;">${lastMasterText}</h4>
    <input style="margin: 0 0 2px; text-align: left; width: 90%;" type="text" name="flags.root.lastMaster" value="${lastMaster}">
    `
    const loveHistoryQuestion = `<h4 style="margin: 8px 0 4px;">${loveHistoryText}</h4>
    <input style="margin: 0 0 2px; text-align: left; width: 90%;" type="text" name="flags.root.loveHistory" value="${loveHistory}">
    `
    const captainQuestion = `<h4 style="margin: 8px 0 4px;">${captainText}</h4>
    <input style="margin: 0 0 2px; text-align: left; width: 90%;" type="text" name="flags.root.captain" value="${captain}">
    `
    const fallCauseQuestion = `<h4 style="margin: 8px 0 4px;">${fallCauseText}</h4>
    <input style="margin: 0 0 2px; text-align: left; width: 90%;" type="text" name="flags.root.fallCause" value="${fallCause}">
    `
    const whyExiledQuestion = `<h4 style="margin: 8px 0 4px;">${whyExiledText}</h4>
    <input style="margin: 0 0 2px; text-align: left; width: 90%;" type="text" name="flags.root.whyExiled" value="${whyExiled}">
    `
    const exileFactionsQuestions = `<h4 style="margin: 8px 0 4px;">${factionExiledText}</h4>
    <input style="margin: 0 0 2px; text-align: left; width: 40%;" type="text" name="flags.root.factionExiled" value="${factionExiled}" placeholder="${factionPlaceholder}">${minus2RepText}</em>
    <h4 style="margin: 8px 0 4px;">${factionLoyaltyText}</h4>
    <input style="margin: 0 0 2px; text-align: left; width: 40%;" type="text" name="flags.root.factionLoyalty" value="${factionLoyalty}" placeholder="${factionPlaceholder}">${plus1RepText}</em>
    `
    const fundamentalTenetsQuestion = `<h4 style="margin: 8px 0 4px;">${fundamentalTenetsText}</h4>
    <input style="margin: 0 0 2px; text-align: left; width: 90%;" type="text" name="flags.root.fundamentalTenets" value="${fundamentalTenets}">
    `
    const hereticFactionsQuestions = `<h4 style="margin: 8px 0 4px;">${factionHateText}</h4>
    <input style="margin: 0 0 2px; text-align: left; width: 40%;" type="text" name="flags.root.factionHate" value="${factionHate}" placeholder="${factionPlaceholder}">${minus1RepText}</em>
    <h4 style="margin: 8px 0 4px;">${factionHarborText}</h4>
    <input style="margin: 0 0 2px; text-align: left; width: 40%;" type="text" name="flags.root.factionHarbor" value="${factionHarbor}" placeholder="${factionPlaceholder}">${plus1RepText}</em>
    `
    const whonWrongQuestion = `<h4 style="margin: 8px 0 4px;">${whomWrongedText}</h4>
    <input style="margin: 0 0 2px; text-align: left; width: 90%;" type="text" name="flags.root.whomWronged" value="${whomWronged}">
    `
    const factionsQuestions = `<h4 style="margin: 8px 0 4px;">${factionServedText}</h4>
    <input style="margin: 0 0 2px; text-align: left; width: 40%;" type="text" name="flags.root.factionServed" value="${factionServed}" placeholder="${factionPlaceholder}">${markPrestigeText}</em>
    <h4 style="margin: 8px 0 4px;">${factionEnmityText}</h4>
    <input style="margin: 0 0 2px; text-align: left; width: 40%;" type="text" name="flags.root.factionEnmity" value="${factionEnmity}" placeholder="${factionPlaceholder}">${markNotorietyText}</em>
    `
    const princeBackgroundQuestions = `<h4 style="margin: 8px 0 4px;">${parentsVagabondText}</h4>
    <input style="margin: 0 0 2px; text-align: left; width: 90%;" type="text" name="flags.root.parentsVagabond" value="${parentsVagabond}">
    <h4 style="margin: 8px 0 4px;">${parentsHappenedText}</h4>
    <input style="margin: 0 0 2px; text-align: left; width: 90%;" type="text" name="flags.root.parentsHappened" value="${parentsHappened}">
    <h4 style="margin: 8px 0 4px;">${parentsFactionServedText}</h4>
    <input style="margin: 0 0 2px; text-align: left; width: 40%;" type="text" name="flags.root.parentsFactionServed" value="${parentsFactionServed}" placeholder="${factionPlaceholder}">${markPrestigeText}</em>
    <h4 style="margin: 8px 0 4px;">${parentsFactionOpposeText}</h4>
    <input style="margin: 0 0 2px; text-align: left; width: 40%;" type="text" name="flags.root.parentsFactionOppose" value="${parentsFactionOppose}" placeholder="${factionPlaceholder}">${markNotorietyText}</em>
    `

    backgroundLabel.append(vagabondSelect)

    if (vagabondBackground != 'custom') {
      descriptionEditor[0].innerHTML = `${detailsHTML}`
    }
    if (vagabondBackground == 'default') {
      descriptionEditor[0].innerHTML += `${whereIsHomeQuestion}${whyVagabondQuestion}${leftBehindQuestion}${factionsQuestions}`
    } else if (vagabondBackground == 'chronicler') {
      descriptionEditor[0].innerHTML += `${whereIsHomeQuestion}${whyVagabondQuestion}${loveHistoryQuestion}${factionsQuestions}`
    } else if (vagabondBackground == 'exile') {
      descriptionEditor[0].innerHTML += `${whereIsHomeQuestion}${fallCauseQuestion}${whyExiledQuestion}${whyVagabondQuestion}${exileFactionsQuestions}`
    } else if (vagabondBackground == 'heretic') {
      descriptionEditor[0].innerHTML += `${whereIsHomeQuestion}${fundamentalTenetsQuestion}${whyVagabondQuestion}${leftBehindQuestion}${hereticFactionsQuestions}`
    } else if (vagabondBackground == 'pirate') {
      descriptionEditor[0].innerHTML += `${whereIsHomeQuestion}${whyVagabondQuestion}${captainQuestion}${factionsQuestions}`
    } else if (vagabondBackground == 'prince') {
      descriptionEditor[0].innerHTML += `${princeBackgroundQuestions}`
    } else if (vagabondBackground == 'raconteur') {
      descriptionEditor[0].innerHTML += `${whereIsHomeQuestion}${whyVagabondQuestion}${whonWrongQuestion}${factionsQuestions}`
    } else if (vagabondBackground == 'ronin') {
      descriptionEditor[0].innerHTML += `${whereIsHomeQuestion}${whyVagabondQuestion}${lastMasterQuestion}${factionsQuestions}`
    }

    /* ----------------------- */
    /*      REPUTATION         */
    /* ----------------------- */

    // Handle reputations' bonuses (only one can be selected per faction)

    function handleReputationBonus(factionsArrays) {
      factionsArrays.forEach((factionArray) => {
        factionArray.forEach((checkbox, index) => {
          checkbox.change(function () {
            if ($(this).is(':checked')) {
              factionArray.forEach((otherCheckbox, otherIndex) => {
                if (otherIndex !== index) {
                  otherCheckbox.prop('checked', false)
                }
              })
            }
          })
        })
      })
    }

    const factionsReputations = [
      [
        html.find('input[name="system.attributes.reputation.options.1.values.3.value"]'),
        html.find('input[name="system.attributes.reputation.options.2.values.3.value"]'),
        html.find('input[name="system.attributes.reputation.options.3.values.3.value"]'),
        html.find('input[name="system.attributes.reputation.options.4.values.0.value"]'),
        html.find('input[name="system.attributes.reputation.options.5.values.5.value"]'),
        html.find('input[name="system.attributes.reputation.options.6.values.5.value"]'),
        html.find('input[name="system.attributes.reputation.options.7.values.5.value"]'),
      ],
      [
        html.find('input[name="system.attributes.reputation.options.9.values.3.value"]'),
        html.find('input[name="system.attributes.reputation.options.10.values.3.value"]'),
        html.find('input[name="system.attributes.reputation.options.11.values.3.value"]'),
        html.find('input[name="system.attributes.reputation.options.12.values.0.value"]'),
        html.find('input[name="system.attributes.reputation.options.13.values.5.value"]'),
        html.find('input[name="system.attributes.reputation.options.14.values.5.value"]'),
        html.find('input[name="system.attributes.reputation.options.15.values.5.value"]'),
      ],
      [
        html.find('input[name="system.attributes.reputation.options.17.values.3.value"]'),
        html.find('input[name="system.attributes.reputation.options.18.values.3.value"]'),
        html.find('input[name="system.attributes.reputation.options.19.values.3.value"]'),
        html.find('input[name="system.attributes.reputation.options.20.values.0.value"]'),
        html.find('input[name="system.attributes.reputation.options.21.values.5.value"]'),
        html.find('input[name="system.attributes.reputation.options.22.values.5.value"]'),
        html.find('input[name="system.attributes.reputation.options.23.values.5.value"]'),
      ],
      [
        html.find('input[name="system.attributes.reputation.options.25.values.3.value"]'),
        html.find('input[name="system.attributes.reputation.options.26.values.3.value"]'),
        html.find('input[name="system.attributes.reputation.options.27.values.3.value"]'),
        html.find('input[name="system.attributes.reputation.options.28.values.0.value"]'),
        html.find('input[name="system.attributes.reputation.options.29.values.5.value"]'),
        html.find('input[name="system.attributes.reputation.options.30.values.5.value"]'),
        html.find('input[name="system.attributes.reputation.options.31.values.5.value"]'),
      ],
      [
        html.find('input[name="system.attributes.reputation.options.33.values.3.value"]'),
        html.find('input[name="system.attributes.reputation.options.34.values.3.value"]'),
        html.find('input[name="system.attributes.reputation.options.35.values.3.value"]'),
        html.find('input[name="system.attributes.reputation.options.36.values.0.value"]'),
        html.find('input[name="system.attributes.reputation.options.37.values.5.value"]'),
        html.find('input[name="system.attributes.reputation.options.38.values.5.value"]'),
        html.find('input[name="system.attributes.reputation.options.39.values.5.value"]'),
      ],
    ]

    handleReputationBonus(factionsReputations)

    // Handle reputation increments
    const firstFactionNotoriety = [
      html.find('input[name="system.attributes.reputation.options.1.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.1.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.1.values.0.value"]'),
      html.find('input[name="system.attributes.reputation.options.2.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.2.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.2.values.0.value"]'),
      html.find('input[name="system.attributes.reputation.options.3.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.3.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.3.values.0.value"]'),
    ]

    const firstFactionPrestige = [
      html.find('input[name="system.attributes.reputation.options.7.values.4.value"]'),
      html.find('input[name="system.attributes.reputation.options.7.values.3.value"]'),
      html.find('input[name="system.attributes.reputation.options.7.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.7.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.7.values.0.value"]'),
      html.find('input[name="system.attributes.reputation.options.6.values.4.value"]'),
      html.find('input[name="system.attributes.reputation.options.6.values.3.value"]'),
      html.find('input[name="system.attributes.reputation.options.6.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.6.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.6.values.0.value"]'),
      html.find('input[name="system.attributes.reputation.options.5.values.4.value"]'),
      html.find('input[name="system.attributes.reputation.options.5.values.3.value"]'),
      html.find('input[name="system.attributes.reputation.options.5.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.5.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.5.values.0.value"]'),
    ]

    const secondFactionNotoriety = [
      html.find('input[name="system.attributes.reputation.options.9.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.9.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.9.values.0.value"]'),
      html.find('input[name="system.attributes.reputation.options.10.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.10.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.10.values.0.value"]'),
      html.find('input[name="system.attributes.reputation.options.11.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.11.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.11.values.0.value"]'),
    ]

    const secondFactionPrestige = [
      html.find('input[name="system.attributes.reputation.options.15.values.4.value"]'),
      html.find('input[name="system.attributes.reputation.options.15.values.3.value"]'),
      html.find('input[name="system.attributes.reputation.options.15.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.15.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.15.values.0.value"]'),
      html.find('input[name="system.attributes.reputation.options.14.values.4.value"]'),
      html.find('input[name="system.attributes.reputation.options.14.values.3.value"]'),
      html.find('input[name="system.attributes.reputation.options.14.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.14.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.14.values.0.value"]'),
      html.find('input[name="system.attributes.reputation.options.13.values.4.value"]'),
      html.find('input[name="system.attributes.reputation.options.13.values.3.value"]'),
      html.find('input[name="system.attributes.reputation.options.13.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.13.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.13.values.0.value"]'),
    ]

    const thirdFactionNotoriety = [
      html.find('input[name="system.attributes.reputation.options.17.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.17.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.17.values.0.value"]'),
      html.find('input[name="system.attributes.reputation.options.18.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.18.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.18.values.0.value"]'),
      html.find('input[name="system.attributes.reputation.options.19.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.19.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.19.values.0.value"]'),
    ]

    const thirdFactionPrestige = [
      html.find('input[name="system.attributes.reputation.options.23.values.4.value"]'),
      html.find('input[name="system.attributes.reputation.options.23.values.3.value"]'),
      html.find('input[name="system.attributes.reputation.options.23.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.23.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.23.values.0.value"]'),
      html.find('input[name="system.attributes.reputation.options.22.values.4.value"]'),
      html.find('input[name="system.attributes.reputation.options.22.values.3.value"]'),
      html.find('input[name="system.attributes.reputation.options.22.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.22.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.22.values.0.value"]'),
      html.find('input[name="system.attributes.reputation.options.21.values.4.value"]'),
      html.find('input[name="system.attributes.reputation.options.21.values.3.value"]'),
      html.find('input[name="system.attributes.reputation.options.21.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.21.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.21.values.0.value"]'),
    ]

    const fourthFactionNotoriety = [
      html.find('input[name="system.attributes.reputation.options.25.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.25.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.25.values.0.value"]'),
      html.find('input[name="system.attributes.reputation.options.26.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.26.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.26.values.0.value"]'),
      html.find('input[name="system.attributes.reputation.options.27.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.27.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.27.values.0.value"]'),
    ]

    const fourthFactionPrestige = [
      html.find('input[name="system.attributes.reputation.options.31.values.4.value"]'),
      html.find('input[name="system.attributes.reputation.options.31.values.3.value"]'),
      html.find('input[name="system.attributes.reputation.options.31.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.31.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.31.values.0.value"]'),
      html.find('input[name="system.attributes.reputation.options.30.values.4.value"]'),
      html.find('input[name="system.attributes.reputation.options.30.values.3.value"]'),
      html.find('input[name="system.attributes.reputation.options.30.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.30.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.30.values.0.value"]'),
      html.find('input[name="system.attributes.reputation.options.29.values.4.value"]'),
      html.find('input[name="system.attributes.reputation.options.29.values.3.value"]'),
      html.find('input[name="system.attributes.reputation.options.29.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.29.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.29.values.0.value"]'),
    ]

    const fifthFactionNotoriety = [
      html.find('input[name="system.attributes.reputation.options.33.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.33.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.33.values.0.value"]'),
      html.find('input[name="system.attributes.reputation.options.34.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.34.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.34.values.0.value"]'),
      html.find('input[name="system.attributes.reputation.options.35.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.35.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.35.values.0.value"]'),
    ]

    const fifthFactionPrestige = [
      html.find('input[name="system.attributes.reputation.options.39.values.4.value"]'),
      html.find('input[name="system.attributes.reputation.options.39.values.3.value"]'),
      html.find('input[name="system.attributes.reputation.options.39.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.39.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.39.values.0.value"]'),
      html.find('input[name="system.attributes.reputation.options.38.values.4.value"]'),
      html.find('input[name="system.attributes.reputation.options.38.values.3.value"]'),
      html.find('input[name="system.attributes.reputation.options.38.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.38.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.38.values.0.value"]'),
      html.find('input[name="system.attributes.reputation.options.37.values.4.value"]'),
      html.find('input[name="system.attributes.reputation.options.37.values.3.value"]'),
      html.find('input[name="system.attributes.reputation.options.37.values.2.value"]'),
      html.find('input[name="system.attributes.reputation.options.37.values.1.value"]'),
      html.find('input[name="system.attributes.reputation.options.37.values.0.value"]'),
    ]

    handleCheckboxIncrements(firstFactionNotoriety)
    handleCheckboxIncrements(firstFactionPrestige)
    handleCheckboxIncrements(secondFactionNotoriety)
    handleCheckboxIncrements(secondFactionPrestige)
    handleCheckboxIncrements(thirdFactionNotoriety)
    handleCheckboxIncrements(thirdFactionPrestige)
    handleCheckboxIncrements(fourthFactionNotoriety)
    handleCheckboxIncrements(fourthFactionPrestige)
    handleCheckboxIncrements(fifthFactionNotoriety)
    handleCheckboxIncrements(fifthFactionPrestige)

    // RESOURCES (injury, exhaustion, depletion)
    const resourceLabels = html.find('.cell.cell--resource .cell__checkboxes label.flexrow')

    resourceLabels.each(function (index) {
      const label = $(this)
      const textNode = label
        .contents()
        .filter(function () {
          return this.nodeType === Node.TEXT_NODE && $(this).text().trim() !== ''
        })
        .first()

      if (textNode.length > 0) {
        const text = textNode.text().trim()
        textNode.remove()

        const textWrapper = $('<div>').text(text)

        const plusIcon = $('<i>').addClass('far fa-plus-square')
        const minusIcon = $('<i>').addClass('far fa-minus-square')

        textWrapper.append(document.createTextNode(' '))
        textWrapper.append(plusIcon)
        textWrapper.append(document.createTextNode(' '))
        textWrapper.append(minusIcon)

        if (index === 0) {
          textWrapper.addClass('injury')
        } else if (index === 1) {
          textWrapper.addClass('exhaustion')
        } else if (index === 2) {
          textWrapper.addClass('depletion')
        }

        label.prepend(textWrapper)
      }
    })

    const addInjuryFive = actor.system.attributes.resource.options['0'].values['4'].value
    const addInjurySix = actor.system.attributes.resource.options['0'].values['6'].value
    const addInjurySeven = actor.system.attributes.resource.options['0'].values['8'].value
    const addInjuryEight = actor.system.attributes.resource.options['0'].values['10'].value

    const injuryFaPlus = html.find('.injury .fa-plus-square')
    const injuryFaMinus = html.find('.injury .fa-minus-square')

    injuryFaPlus.click(async function (event) {
      if (addInjuryFive == false) {
        await actor.update({ 'system.attributes.resource.options.0.values.4.value': true })
      } else if (addInjurySix == false) {
        await actor.update({ 'system.attributes.resource.options.0.values.6.value': true })
      } else if (addInjurySeven == false) {
        await actor.update({ 'system.attributes.resource.options.0.values.8.value': true })
      } else if (addInjuryEight == false) {
        await actor.update({ 'system.attributes.resource.options.0.values.10.value': true })
      }
    })

    injuryFaMinus.click(async function (event) {
      if (addInjuryEight == true) {
        await actor.update({ 'system.attributes.resource.options.0.values.10.value': false })
      } else if (addInjurySeven == true) {
        await actor.update({ 'system.attributes.resource.options.0.values.8.value': false })
      } else if (addInjurySix == true) {
        await actor.update({ 'system.attributes.resource.options.0.values.6.value': false })
      } else if (addInjuryFive == true) {
        await actor.update({ 'system.attributes.resource.options.0.values.4.value': false })
      }
    })

    const addExhaustionFive = actor.system.attributes.resource.options['1'].values['4'].value
    const addExhaustionSix = actor.system.attributes.resource.options['1'].values['6'].value
    const addExhaustionSeven = actor.system.attributes.resource.options['1'].values['8'].value
    const addExhaustionEight = actor.system.attributes.resource.options['1'].values['10'].value

    const exhaustionFaPlus = html.find('.exhaustion .fa-plus-square')
    const exhaustionFaMinus = html.find('.exhaustion .fa-minus-square')

    exhaustionFaPlus.click(async function (event) {
      if (addExhaustionFive == false) {
        await actor.update({ 'system.attributes.resource.options.1.values.4.value': true })
      } else if (addExhaustionSix == false) {
        await actor.update({ 'system.attributes.resource.options.1.values.6.value': true })
      } else if (addExhaustionSeven == false) {
        await actor.update({ 'system.attributes.resource.options.1.values.8.value': true })
      } else if (addExhaustionEight == false) {
        await actor.update({ 'system.attributes.resource.options.1.values.10.value': true })
      }
    })

    exhaustionFaMinus.click(async function (event) {
      if (addExhaustionEight == true) {
        await actor.update({ 'system.attributes.resource.options.1.values.10.value': false })
      } else if (addExhaustionSeven == true) {
        await actor.update({ 'system.attributes.resource.options.1.values.8.value': false })
      } else if (addExhaustionSix == true) {
        await actor.update({ 'system.attributes.resource.options.1.values.6.value': false })
      } else if (addExhaustionFive == true) {
        await actor.update({ 'system.attributes.resource.options.1.values.4.value': false })
      }
    })

    const addDepletionFive = actor.system.attributes.resource.options['2'].values['4'].value
    const addDepletionSix = actor.system.attributes.resource.options['2'].values['6'].value
    const addDepletionSeven = actor.system.attributes.resource.options['2'].values['8'].value
    const addDepletionEight = actor.system.attributes.resource.options['2'].values['10'].value

    const depletionFaPlus = html.find('.depletion .fa-plus-square')
    const depletionFaMinus = html.find('.depletion .fa-minus-square')

    depletionFaPlus.click(async function (event) {
      if (addDepletionFive == false) {
        await actor.update({ 'system.attributes.resource.options.2.values.4.value': true })
      } else if (addDepletionSix == false) {
        await actor.update({ 'system.attributes.resource.options.2.values.6.value': true })
      } else if (addDepletionSeven == false) {
        await actor.update({ 'system.attributes.resource.options.2.values.8.value': true })
      } else if (addDepletionEight == false) {
        await actor.update({ 'system.attributes.resource.options.2.values.10.value': true })
      }
    })

    depletionFaMinus.click(async function (event) {
      if (addDepletionEight == true) {
        await actor.update({ 'system.attributes.resource.options.2.values.10.value': false })
      } else if (addDepletionSeven == true) {
        await actor.update({ 'system.attributes.resource.options.2.values.8.value': false })
      } else if (addDepletionSix == true) {
        await actor.update({ 'system.attributes.resource.options.2.values.6.value': false })
      } else if (addDepletionFive == true) {
        await actor.update({ 'system.attributes.resource.options.2.values.4.value': false })
      }
    })

    // Handle resouce increments
    const injuryResource = [
      html.find('input[name="system.attributes.resource.options.0.values.11.value"]'),
      html.find('input[name="system.attributes.resource.options.0.values.9.value"]'),
      html.find('input[name="system.attributes.resource.options.0.values.7.value"]'),
      html.find('input[name="system.attributes.resource.options.0.values.5.value"]'),
      html.find('input[name="system.attributes.resource.options.0.values.3.value"]'),
      html.find('input[name="system.attributes.resource.options.0.values.2.value"]'),
      html.find('input[name="system.attributes.resource.options.0.values.1.value"]'),
      html.find('input[name="system.attributes.resource.options.0.values.0.value"]'),
    ]

    const exhaustionResource = [
      html.find('input[name="system.attributes.resource.options.1.values.11.value"]'),
      html.find('input[name="system.attributes.resource.options.1.values.9.value"]'),
      html.find('input[name="system.attributes.resource.options.1.values.7.value"]'),
      html.find('input[name="system.attributes.resource.options.1.values.5.value"]'),
      html.find('input[name="system.attributes.resource.options.1.values.3.value"]'),
      html.find('input[name="system.attributes.resource.options.1.values.2.value"]'),
      html.find('input[name="system.attributes.resource.options.1.values.1.value"]'),
      html.find('input[name="system.attributes.resource.options.1.values.0.value"]'),
    ]

    const depletionResource = [
      html.find('input[name="system.attributes.resource.options.2.values.11.value"]'),
      html.find('input[name="system.attributes.resource.options.2.values.9.value"]'),
      html.find('input[name="system.attributes.resource.options.2.values.7.value"]'),
      html.find('input[name="system.attributes.resource.options.2.values.5.value"]'),
      html.find('input[name="system.attributes.resource.options.2.values.3.value"]'),
      html.find('input[name="system.attributes.resource.options.2.values.2.value"]'),
      html.find('input[name="system.attributes.resource.options.2.values.1.value"]'),
      html.find('input[name="system.attributes.resource.options.2.values.0.value"]'),
    ]

    handleCheckboxIncrements(injuryResource)
    handleCheckboxIncrements(exhaustionResource)
    handleCheckboxIncrements(depletionResource)

    // Add Mastery tag to actor sheet if move has Triumph description.
    const masteries = game.settings.get('root', 'masteries')
    const metaTags = html.find('.item-meta.tags')
    const items = metaTags.parent('li.item')
    for (const item of items) {
      const critical = item.querySelector('div.result--critical')
      if (critical) {
        if (masteries) {
          const formulaTag = item.querySelector('.tag.tag--formula')
          const mastery = `<span class="tag tag--mastery">Mastery</span>`
          formulaTag.insertAdjacentHTML('beforebegin', mastery)
        } else {
          critical.style.display = 'none'
        }
      }
    }
  }

  if (actor.type == 'npc') {
    const resourcesTitlesNPC = html.find('.cell.cell--attributes-top label.cell__title')

    const faPlusMinus = `<i class="npc far fa-plus-square"></i><i class="npc far fa-minus-square"></i>`
    resourcesTitlesNPC.each(function () {
      $(this).append(faPlusMinus)
    })

    // Get the initial value of injury
    const addNPCInjuryTwo = actor.system.attributes.injury.options['0'].values['1'].value
    const addNPCInjuryThree = actor.system.attributes.injury.options['0'].values['3'].value
    const addNPCInjuryFour = actor.system.attributes.injury.options['0'].values['5'].value
    const addNPCInjuryFive = actor.system.attributes.injury.options['0'].values['7'].value
    const addNPCInjurySix = actor.system.attributes.injury.options['0'].values['9'].value
    const addNPCInjurySeven = actor.system.attributes.injury.options['0'].values['11'].value
    const addNPCInjuryEight = actor.system.attributes.injury.options['0'].values['13'].value
    const addNPCInjuryNine = actor.system.attributes.injury.options['0'].values['15'].value
    const addNPCInjuryTen = actor.system.attributes.injury.options['0'].values['17'].value
    const addNPCInjuryEleven = actor.system.attributes.injury.options['0'].values['19'].value
    const addNPCInjuryTwelve = actor.system.attributes.injury.options['0'].values['21'].value

    // Set the event listeners
    const injuryNPCFaPlus = html.find('.cell--injury .fa-plus-square')
    const injuryNPCFaMinus = html.find('.cell--injury .fa-minus-square')

    injuryNPCFaPlus.click(async function (event) {
      if (addNPCInjuryTwo == false) {
        await actor.update({ 'system.attributes.injury.options.0.values.1.value': true })
      } else if (addNPCInjuryThree == false) {
        await actor.update({ 'system.attributes.injury.options.0.values.3.value': true })
      } else if (addNPCInjuryFour == false) {
        await actor.update({ 'system.attributes.injury.options.0.values.5.value': true })
      } else if (addNPCInjuryFive == false) {
        await actor.update({ 'system.attributes.injury.options.0.values.7.value': true })
      } else if (addNPCInjurySix == false) {
        await actor.update({ 'system.attributes.injury.options.0.values.9.value': true })
      } else if (addNPCInjurySeven == false) {
        await actor.update({ 'system.attributes.injury.options.0.values.11.value': true })
      } else if (addNPCInjuryEight == false) {
        await actor.update({ 'system.attributes.injury.options.0.values.13.value': true })
      } else if (addNPCInjuryNine == false) {
        await actor.update({ 'system.attributes.injury.options.0.values.15.value': true })
      } else if (addNPCInjuryTen == false) {
        await actor.update({ 'system.attributes.injury.options.0.values.17.value': true })
      } else if (addNPCInjuryEleven == false) {
        await actor.update({ 'system.attributes.injury.options.0.values.19.value': true })
      } else if (addNPCInjuryTwelve == false) {
        await actor.update({ 'system.attributes.injury.options.0.values.21.value': true })
      }
    })

    injuryNPCFaMinus.click(async function (event) {
      if (addNPCInjuryTwelve == true) {
        await actor.update({ 'system.attributes.injury.options.0.values.21.value': false })
      } else if (addNPCInjuryEleven == true) {
        await actor.update({ 'system.attributes.injury.options.0.values.19.value': false })
      } else if (addNPCInjuryTen == true) {
        await actor.update({ 'system.attributes.injury.options.0.values.17.value': false })
      } else if (addNPCInjuryNine == true) {
        await actor.update({ 'system.attributes.injury.options.0.values.15.value': false })
      } else if (addNPCInjuryEight == true) {
        await actor.update({ 'system.attributes.injury.options.0.values.13.value': false })
      } else if (addNPCInjurySeven == true) {
        await actor.update({ 'system.attributes.injury.options.0.values.11.value': false })
      } else if (addNPCInjurySix == true) {
        await actor.update({ 'system.attributes.injury.options.0.values.9.value': false })
      } else if (addNPCInjuryFive == true) {
        await actor.update({ 'system.attributes.injury.options.0.values.7.value': false })
      } else if (addNPCInjuryFour == true) {
        await actor.update({ 'system.attributes.injury.options.0.values.5.value': false })
      } else if (addNPCInjuryThree == true) {
        await actor.update({ 'system.attributes.injury.options.0.values.3.value': false })
      } else if (addNPCInjuryTwo == true) {
        await actor.update({ 'system.attributes.injury.options.0.values.1.value': false })
      }
    })

    // Get the initial value of the exhaustion and other variables
    const addNPCExhaustionTwo = actor.system.attributes.exhaustion.options['0'].values['1'].value
    const addNPCExhaustionThree = actor.system.attributes.exhaustion.options['0'].values['3'].value
    const addNPCExhaustionFour = actor.system.attributes.exhaustion.options['0'].values['5'].value
    const addNPCExhaustionFive = actor.system.attributes.exhaustion.options['0'].values['7'].value
    const addNPCExhaustionSix = actor.system.attributes.exhaustion.options['0'].values['9'].value
    const addNPCExhaustionSeven = actor.system.attributes.exhaustion.options['0'].values['11'].value
    const addNPCExhaustionEight = actor.system.attributes.exhaustion.options['0'].values['13'].value
    const addNPCExhaustionNine = actor.system.attributes.exhaustion.options['0'].values['15'].value
    const addNPCExhaustionTen = actor.system.attributes.exhaustion.options['0'].values['17'].value
    const addNPCExhaustionEleven =
      actor.system.attributes.exhaustion.options['0'].values['19'].value
    const addNPCExhaustionTwelve =
      actor.system.attributes.exhaustion.options['0'].values['21'].value

    // Set the event listeners for Exhaustion
    const exhaustionNPCFaPlus = html.find('.cell--exhaustion .fa-plus-square')
    const exhaustionNPCFaMinus = html.find('.cell--exhaustion .fa-minus-square')

    exhaustionNPCFaPlus.click(async function (event) {
      if (addNPCExhaustionTwo == false) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.1.value': true })
      } else if (addNPCExhaustionThree == false) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.3.value': true })
      } else if (addNPCExhaustionFour == false) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.5.value': true })
      } else if (addNPCExhaustionFive == false) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.7.value': true })
      } else if (addNPCExhaustionSix == false) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.9.value': true })
      } else if (addNPCExhaustionSeven == false) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.11.value': true })
      } else if (addNPCExhaustionEight == false) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.13.value': true })
      } else if (addNPCExhaustionNine == false) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.15.value': true })
      } else if (addNPCExhaustionTen == false) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.17.value': true })
      } else if (addNPCExhaustionEleven == false) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.19.value': true })
      } else if (addNPCExhaustionTwelve == false) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.21.value': true })
      }
    })

    exhaustionNPCFaMinus.click(async function (event) {
      if (addNPCExhaustionTwelve == true) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.21.value': false })
      } else if (addNPCExhaustionEleven == true) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.19.value': false })
      } else if (addNPCExhaustionTen == true) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.17.value': false })
      } else if (addNPCExhaustionNine == true) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.15.value': false })
      } else if (addNPCExhaustionEight == true) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.13.value': false })
      } else if (addNPCExhaustionSeven == true) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.11.value': false })
      } else if (addNPCExhaustionSix == true) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.9.value': false })
      } else if (addNPCExhaustionFive == true) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.7.value': false })
      } else if (addNPCExhaustionFour == true) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.5.value': false })
      } else if (addNPCExhaustionThree == true) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.3.value': false })
      } else if (addNPCExhaustionTwo == true) {
        await actor.update({ 'system.attributes.exhaustion.options.0.values.1.value': false })
      }
    })

    // Get the initial value of wear and other variables
    const addNPCWearOne = (await actor.getFlag('root', 'npcWear.addBox1')) || false
    const addNPCWearTwo = actor.system.attributes.wear.options['0'].values['1'].value
    const addNPCWearThree = actor.system.attributes.wear.options['0'].values['3'].value
    const addNPCWearFour = actor.system.attributes.wear.options['0'].values['5'].value
    const addNPCWearFive = actor.system.attributes.wear.options['0'].values['7'].value
    const addNPCWearSix = actor.system.attributes.wear.options['0'].values['9'].value
    const addNPCWearSeven = actor.system.attributes.wear.options['0'].values['11'].value
    const addNPCWearEight = actor.system.attributes.wear.options['0'].values['13'].value
    const addNPCWearNine = actor.system.attributes.wear.options['0'].values['15'].value
    const addNPCWearTen = actor.system.attributes.wear.options['0'].values['17'].value
    const addNPCWearEleven = actor.system.attributes.wear.options['0'].values['19'].value
    const addNPCWearTwelve = actor.system.attributes.wear.options['0'].values['21'].value

    // Prepend addBox1
    const npcAddWear1 = `<input type="checkbox" name="flags.root.npcWear.addBox1" data-dtype="Boolean" ${addNPCWearOne ? 'checked' : ''}></input>`
    const npcWear1 = html.find('input[name="system.attributes.wear.options.0.values.0.value"]')
    npcWear1.before(npcAddWear1)
    // Set the event listeners for Wear
    const wearNPCFaPlus = html.find('.cell--wear .fa-plus-square')
    const wearNPCFaMinus = html.find('.cell--wear .fa-minus-square')

    wearNPCFaPlus.click(async function (event) {
      if (addNPCWearOne == false) {
        await actor.update({ 'flags.root.npcWear.addBox1': true })
      } else if (addNPCWearTwo == false) {
        await actor.update({ 'system.attributes.wear.options.0.values.1.value': true })
      } else if (addNPCWearThree == false) {
        await actor.update({ 'system.attributes.wear.options.0.values.3.value': true })
      } else if (addNPCWearFour == false) {
        await actor.update({ 'system.attributes.wear.options.0.values.5.value': true })
      } else if (addNPCWearFive == false) {
        await actor.update({ 'system.attributes.wear.options.0.values.7.value': true })
      } else if (addNPCWearSix == false) {
        await actor.update({ 'system.attributes.wear.options.0.values.9.value': true })
      } else if (addNPCWearSeven == false) {
        await actor.update({ 'system.attributes.wear.options.0.values.11.value': true })
      } else if (addNPCWearEight == false) {
        await actor.update({ 'system.attributes.wear.options.0.values.13.value': true })
      } else if (addNPCWearNine == false) {
        await actor.update({ 'system.attributes.wear.options.0.values.15.value': true })
      } else if (addNPCWearTen == false) {
        await actor.update({ 'system.attributes.wear.options.0.values.17.value': true })
      } else if (addNPCWearEleven == false) {
        await actor.update({ 'system.attributes.wear.options.0.values.19.value': true })
      } else if (addNPCWearTwelve == false) {
        await actor.update({ 'system.attributes.wear.options.0.values.21.value': true })
      }
    })

    wearNPCFaMinus.click(async function (event) {
      if (addNPCWearTwelve == true) {
        await actor.update({ 'system.attributes.wear.options.0.values.21.value': false })
      } else if (addNPCWearEleven == true) {
        await actor.update({ 'system.attributes.wear.options.0.values.19.value': false })
      } else if (addNPCWearTen == true) {
        await actor.update({ 'system.attributes.wear.options.0.values.17.value': false })
      } else if (addNPCWearNine == true) {
        await actor.update({ 'system.attributes.wear.options.0.values.15.value': false })
      } else if (addNPCWearEight == true) {
        await actor.update({ 'system.attributes.wear.options.0.values.13.value': false })
      } else if (addNPCWearSeven == true) {
        await actor.update({ 'system.attributes.wear.options.0.values.11.value': false })
      } else if (addNPCWearSix == true) {
        await actor.update({ 'system.attributes.wear.options.0.values.9.value': false })
      } else if (addNPCWearFive == true) {
        await actor.update({ 'system.attributes.wear.options.0.values.7.value': false })
      } else if (addNPCWearFour == true) {
        await actor.update({ 'system.attributes.wear.options.0.values.5.value': false })
      } else if (addNPCWearThree == true) {
        await actor.update({ 'system.attributes.wear.options.0.values.3.value': false })
      } else if (addNPCWearTwo == true) {
        await actor.update({ 'system.attributes.wear.options.0.values.1.value': false })
      } else if (addNPCWearOne == true) {
        await actor.update({ 'flags.root.npcWear.addBox1': false })
      }
    })

    // Get the initial value of morale and other variables
    const addNPCMoraleTwo = actor.system.attributes.morale.options['0'].values['1'].value
    const addNPCMoraleThree = actor.system.attributes.morale.options['0'].values['3'].value
    const addNPCMoraleFour = actor.system.attributes.morale.options['0'].values['5'].value
    const addNPCMoraleFive = actor.system.attributes.morale.options['0'].values['7'].value
    const addNPCMoraleSix = actor.system.attributes.morale.options['0'].values['9'].value
    const addNPCMoraleSeven = actor.system.attributes.morale.options['0'].values['11'].value
    const addNPCMoraleEight = actor.system.attributes.morale.options['0'].values['13'].value
    const addNPCMoraleNine = actor.system.attributes.morale.options['0'].values['15'].value
    const addNPCMoraleTen = actor.system.attributes.morale.options['0'].values['17'].value
    const addNPCMoraleEleven = actor.system.attributes.morale.options['0'].values['19'].value
    const addNPCMoraleTwelve = actor.system.attributes.morale.options['0'].values['21'].value

    // Set the event listeners for Morale
    const moraleNPCFaPlus = html.find('.cell--morale .fa-plus-square')
    const moraleNPCFaMinus = html.find('.cell--morale .fa-minus-square')

    moraleNPCFaPlus.click(async function (event) {
      if (addNPCMoraleTwo == false) {
        await actor.update({ 'system.attributes.morale.options.0.values.1.value': true })
      } else if (addNPCMoraleThree == false) {
        await actor.update({ 'system.attributes.morale.options.0.values.3.value': true })
      } else if (addNPCMoraleFour == false) {
        await actor.update({ 'system.attributes.morale.options.0.values.5.value': true })
      } else if (addNPCMoraleFive == false) {
        await actor.update({ 'system.attributes.morale.options.0.values.7.value': true })
      } else if (addNPCMoraleSix == false) {
        await actor.update({ 'system.attributes.morale.options.0.values.9.value': true })
      } else if (addNPCMoraleSeven == false) {
        await actor.update({ 'system.attributes.morale.options.0.values.11.value': true })
      } else if (addNPCMoraleEight == false) {
        await actor.update({ 'system.attributes.morale.options.0.values.13.value': true })
      } else if (addNPCMoraleNine == false) {
        await actor.update({ 'system.attributes.morale.options.0.values.15.value': true })
      } else if (addNPCMoraleTen == false) {
        await actor.update({ 'system.attributes.morale.options.0.values.17.value': true })
      } else if (addNPCMoraleEleven == false) {
        await actor.update({ 'system.attributes.morale.options.0.values.19.value': true })
      } else if (addNPCMoraleTwelve == false) {
        await actor.update({ 'system.attributes.morale.options.0.values.21.value': true })
      }
    })

    moraleNPCFaMinus.click(async function (event) {
      if (addNPCMoraleTwelve == true) {
        await actor.update({ 'system.attributes.morale.options.0.values.21.value': false })
      } else if (addNPCMoraleEleven == true) {
        await actor.update({ 'system.attributes.morale.options.0.values.19.value': false })
      } else if (addNPCMoraleTen == true) {
        await actor.update({ 'system.attributes.morale.options.0.values.17.value': false })
      } else if (addNPCMoraleNine == true) {
        await actor.update({ 'system.attributes.morale.options.0.values.15.value': false })
      } else if (addNPCMoraleEight == true) {
        await actor.update({ 'system.attributes.morale.options.0.values.13.value': false })
      } else if (addNPCMoraleSeven == true) {
        await actor.update({ 'system.attributes.morale.options.0.values.11.value': false })
      } else if (addNPCMoraleSix == true) {
        await actor.update({ 'system.attributes.morale.options.0.values.9.value': false })
      } else if (addNPCMoraleFive == true) {
        await actor.update({ 'system.attributes.morale.options.0.values.7.value': false })
      } else if (addNPCMoraleFour == true) {
        await actor.update({ 'system.attributes.morale.options.0.values.5.value': false })
      } else if (addNPCMoraleThree == true) {
        await actor.update({ 'system.attributes.morale.options.0.values.3.value': false })
      } else if (addNPCMoraleTwo == true) {
        await actor.update({ 'system.attributes.morale.options.0.values.1.value': false })
      }
    })

    // Handle NPC resource increments
    const injuryNPCResource = [
      html.find('input[name="system.attributes.injury.options.0.values.22.value"]'),
      html.find('input[name="system.attributes.injury.options.0.values.20.value"]'),
      html.find('input[name="system.attributes.injury.options.0.values.18.value"]'),
      html.find('input[name="system.attributes.injury.options.0.values.16.value"]'),
      html.find('input[name="system.attributes.injury.options.0.values.14.value"]'),
      html.find('input[name="system.attributes.injury.options.0.values.12.value"]'),
      html.find('input[name="system.attributes.injury.options.0.values.10.value"]'),
      html.find('input[name="system.attributes.injury.options.0.values.8.value"]'),
      html.find('input[name="system.attributes.injury.options.0.values.6.value"]'),
      html.find('input[name="system.attributes.injury.options.0.values.4.value"]'),
      html.find('input[name="system.attributes.injury.options.0.values.2.value"]'),
      html.find('input[name="system.attributes.injury.options.0.values.0.value"]'),
    ]

    const exhaustionNPCResource = [
      html.find('input[name="system.attributes.exhaustion.options.0.values.22.value"]'),
      html.find('input[name="system.attributes.exhaustion.options.0.values.20.value"]'),
      html.find('input[name="system.attributes.exhaustion.options.0.values.18.value"]'),
      html.find('input[name="system.attributes.exhaustion.options.0.values.16.value"]'),
      html.find('input[name="system.attributes.exhaustion.options.0.values.14.value"]'),
      html.find('input[name="system.attributes.exhaustion.options.0.values.12.value"]'),
      html.find('input[name="system.attributes.exhaustion.options.0.values.10.value"]'),
      html.find('input[name="system.attributes.exhaustion.options.0.values.8.value"]'),
      html.find('input[name="system.attributes.exhaustion.options.0.values.6.value"]'),
      html.find('input[name="system.attributes.exhaustion.options.0.values.4.value"]'),
      html.find('input[name="system.attributes.exhaustion.options.0.values.2.value"]'),
      html.find('input[name="system.attributes.exhaustion.options.0.values.0.value"]'),
    ]

    const wearNPCResource = [
      html.find('input[name="system.attributes.wear.options.0.values.22.value"]'),
      html.find('input[name="system.attributes.wear.options.0.values.20.value"]'),
      html.find('input[name="system.attributes.wear.options.0.values.18.value"]'),
      html.find('input[name="system.attributes.wear.options.0.values.16.value"]'),
      html.find('input[name="system.attributes.wear.options.0.values.14.value"]'),
      html.find('input[name="system.attributes.wear.options.0.values.12.value"]'),
      html.find('input[name="system.attributes.wear.options.0.values.10.value"]'),
      html.find('input[name="system.attributes.wear.options.0.values.8.value"]'),
      html.find('input[name="system.attributes.wear.options.0.values.6.value"]'),
      html.find('input[name="system.attributes.wear.options.0.values.4.value"]'),
      html.find('input[name="system.attributes.wear.options.0.values.2.value"]'),
      html.find('input[name="system.attributes.wear.options.0.values.0.value"]'),
    ]

    const moraleNPCResource = [
      html.find('input[name="system.attributes.morale.options.0.values.22.value"]'),
      html.find('input[name="system.attributes.morale.options.0.values.20.value"]'),
      html.find('input[name="system.attributes.morale.options.0.values.18.value"]'),
      html.find('input[name="system.attributes.morale.options.0.values.16.value"]'),
      html.find('input[name="system.attributes.morale.options.0.values.14.value"]'),
      html.find('input[name="system.attributes.morale.options.0.values.12.value"]'),
      html.find('input[name="system.attributes.morale.options.0.values.10.value"]'),
      html.find('input[name="system.attributes.morale.options.0.values.8.value"]'),
      html.find('input[name="system.attributes.morale.options.0.values.6.value"]'),
      html.find('input[name="system.attributes.morale.options.0.values.4.value"]'),
      html.find('input[name="system.attributes.morale.options.0.values.2.value"]'),
      html.find('input[name="system.attributes.morale.options.0.values.0.value"]'),
    ]

    handleCheckboxIncrements(injuryNPCResource)
    handleCheckboxIncrements(exhaustionNPCResource)
    handleCheckboxIncrements(wearNPCResource)
    handleCheckboxIncrements(moraleNPCResource)
  }
})

Hooks.on('renderApplication', (app, html, options) => {
  // let settings = app.options.id == "client-settings";
  // if (settings) {
  //   let systemSettings = html.find('section[data-tab="system"]')
  //   let warningText = game.i18n.localize('Root.Settings.System');;
  //   let warning = `<div style="margin-top: 100px;" class="notification error">${warningText}</div>
  //   `
  //   systemSettings[0].innerHTML = warning;
  // }
})
