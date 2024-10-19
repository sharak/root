export const configSheet = async () => {
  // Pass Root sheet object to sheeConfig

  game.pbta.sheetConfig = {
    rollFormula: '2d6',
    rollResults: {
      failure: {
        start: null,
        end: 6,
        label: game.i18n.localize('Root.Sheet.Results.Failure'),
      },
      partial: {
        start: 7,
        end: 9,
        label: game.i18n.localize('Root.Sheet.Results.Partial'),
      },
      success: {
        start: 10,
        end: null,
        label: game.i18n.localize('Root.Sheet.Results.Success'),
      },
      critical: {
        start: null,
        end: null,
        label: game.i18n.localize('Root.Sheet.Results.Critical'),
      },
    },
    actorTypes: {
      character: {
        stats: {
          charm: {
            label: game.i18n.localize('Root.Sheet.Stats.Charm'),
            value: 0,
          },
          cunning: {
            label: game.i18n.localize('Root.Sheet.Stats.Cunning'),
            value: 0,
          },
          finesse: {
            label: game.i18n.localize('Root.Sheet.Stats.Finesse'),
            value: 0,
          },
          luck: {
            label: game.i18n.localize('Root.Sheet.Stats.Luck'),
            value: 0,
          },
          might: {
            label: game.i18n.localize('Root.Sheet.Stats.Might'),
            value: 0,
          },
        },
        attributes: {
          reputation: {
            position: 'top',
            label: game.i18n.localize('Root.Sheet.AttrTop.Reputation.Label'),
            description: null,
            customLabel: false,
            userLabel: false,
            type: 'ListMany',
            condition: false,
            options: {
              0: {
                label: '[Text]',
                value: false,
                values: {},
              },
              1: {
                label: '-3',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                },
              },
              2: {
                label: '-2',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                },
              },
              3: {
                label: '-1',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                },
              },
              4: {
                label: '+0',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                },
              },
              5: {
                label: '+1',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                },
              },
              6: {
                label: '+2',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                },
              },
              7: {
                label: '+3',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                },
              },
              8: {
                label: '[Text]',
                value: false,
                values: {},
              },
              9: {
                label: '-3',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                },
              },
              10: {
                label: '-2',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                },
              },
              11: {
                label: '-1',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                },
              },
              12: {
                label: '+0',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                },
              },
              13: {
                label: '+1',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                },
              },
              14: {
                label: '+2',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                },
              },
              15: {
                label: '+3',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                },
              },
              16: {
                label: '[Text]',
                value: false,
                values: {},
              },
              17: {
                label: '-3',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                },
              },
              18: {
                label: '-2',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                },
              },
              19: {
                label: '-1',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                },
              },
              20: {
                label: '+0',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                },
              },
              21: {
                label: '+1',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                },
              },
              22: {
                label: '+2',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                },
              },
              23: {
                label: '+3',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                },
              },
              24: {
                label: '[Text]',
                value: false,
                values: {},
              },
              25: {
                label: '-3',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                },
              },
              26: {
                label: '-2',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                },
              },
              27: {
                label: '-1',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                },
              },
              28: {
                label: '+0',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                },
              },
              29: {
                label: '+1',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                },
              },
              30: {
                label: '+2',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                },
              },
              31: {
                label: '+3',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                },
              },
              32: {
                label: '[Text]',
                value: false,
                values: {},
              },
              33: {
                label: '-3',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                },
              },
              34: {
                label: '-2',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                },
              },
              35: {
                label: '-1',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                },
              },
              36: {
                label: '+0',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                },
              },
              37: {
                label: '+1',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                },
              },
              38: {
                label: '+2',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                },
              },
              39: {
                label: '+3',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                },
              },
              40: {
                label: game.i18n.localize('Root.Sheet.AttrTop.Reputation.Notoriety'),
                value: false,
                values: {},
              },
              41: {
                label: game.i18n.localize('Root.Sheet.AttrTop.Reputation.Prestige'),
                value: false,
                values: {},
              },
            },
          },
          resource: {
            position: 'left',
            label: ' ',
            description: null,
            customLabel: false,
            userLabel: false,
            type: 'ListMany',
            condition: false,
            options: {
              0: {
                label: game.i18n.localize('Root.Sheet.AttrLeft.Resource.Injury'),
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                  6: {
                    value: false,
                  },
                  7: {
                    value: false,
                  },
                  8: {
                    value: false,
                  },
                  9: {
                    value: false,
                  },
                  10: {
                    value: false,
                  },
                  11: {
                    value: false,
                  },
                },
              },
              1: {
                label: game.i18n.localize('Root.Sheet.AttrLeft.Resource.Exhaustion'),
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                  6: {
                    value: false,
                  },
                  7: {
                    value: false,
                  },
                  8: {
                    value: false,
                  },
                  9: {
                    value: false,
                  },
                  10: {
                    value: false,
                  },
                  11: {
                    value: false,
                  },
                },
              },
              2: {
                label: game.i18n.localize('Root.Sheet.AttrLeft.Resource.Depletion'),
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                  6: {
                    value: false,
                  },
                  7: {
                    value: false,
                  },
                  8: {
                    value: false,
                  },
                  9: {
                    value: false,
                  },
                  10: {
                    value: false,
                  },
                  11: {
                    value: false,
                  },
                },
              },
            },
          },
          nature: {
            position: 'left',
            label: game.i18n.localize('Root.Sheet.AttrLeft.Nature'),
            description: null,
            customLabel: false,
            userLabel: false,
            type: 'LongText',
            value: '',
          },
          drive: {
            position: 'left',
            label: game.i18n.localize('Root.Sheet.AttrLeft.Drives'),
            description: null,
            customLabel: false,
            userLabel: false,
            type: 'LongText',
            value: '',
          },
          connection: {
            position: 'left',
            label: game.i18n.localize('Root.Sheet.AttrLeft.Connections'),
            description: null,
            customLabel: false,
            userLabel: false,
            type: 'LongText',
            value: '',
          },
          feat: {
            position: 'left',
            label: game.i18n.localize('Root.Sheet.AttrLeft.Feats'),
            description: null,
            customLabel: false,
            userLabel: false,
            type: 'LongText',
            value: '',
          },
          startingvalue: {
            position: 'left',
            label: game.i18n.localize('Root.Sheet.AttrLeft.Equipment.Label'),
            description: game.i18n.localize('Root.Sheet.AttrLeft.Equipment.Description'),
            customLabel: false,
            userLabel: false,
            type: 'Number',
            value: 0,
          },
          carrying: {
            position: 'left',
            label: game.i18n.localize('Root.Sheet.AttrLeft.Carrying'),
            description: null,
            customLabel: false,
            userLabel: false,
            type: 'Number',
            value: 0,
          },
          burdened: {
            position: 'left',
            label: game.i18n.localize('Root.Sheet.AttrLeft.Burdened'),
            description: null,
            customLabel: false,
            userLabel: false,
            type: 'Number',
            value: 0,
          },
          max: {
            position: 'left',
            label: game.i18n.localize('Root.Sheet.AttrLeft.Max'),
            description: null,
            customLabel: false,
            userLabel: false,
            type: 'Number',
            value: 0,
          },
        },
        moveTypes: {
          basic: {
            label: game.i18n.localize('Root.Sheet.Moves.Basic'),
            creation: true,
            moves: [],
          },
          playbook: {
            label: game.i18n.localize('Root.Sheet.Moves.Playbook'),
            moves: [],
          },
          weapon: {
            label: game.i18n.localize('Root.Sheet.Moves.Weapon'),
            moves: [],
          },
          travel: {
            label: game.i18n.localize('Root.Sheet.Moves.Travel'),
            creation: true,
            moves: [],
          },
          reputation: {
            label: game.i18n.localize('Root.Sheet.Moves.Reputation'),
            creation: true,
            moves: [],
          },
        },
        equipmentTypes: {
          equipment: {
            label: game.i18n.localize('Root.Sheet.Items.Equipment'),
            moves: [],
          },
        },
      },
      npc: {
        attributes: {
          injury: {
            position: 'top',
            label: game.i18n.localize('Root.Sheet.NPC.Injury'),
            description: null,
            customLabel: false,
            userLabel: false,
            type: 'ListMany',
            condition: false,
            options: {
              0: {
                label: '',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                  6: {
                    value: false,
                  },
                  7: {
                    value: false,
                  },
                  8: {
                    value: false,
                  },
                  9: {
                    value: false,
                  },
                  10: {
                    value: false,
                  },
                  11: {
                    value: false,
                  },
                  12: {
                    value: false,
                  },
                  13: {
                    value: false,
                  },
                  14: {
                    value: false,
                  },
                  15: {
                    value: false,
                  },
                  16: {
                    value: false,
                  },
                  17: {
                    value: false,
                  },
                  18: {
                    value: false,
                  },
                  19: {
                    value: false,
                  },
                  20: {
                    value: false,
                  },
                  21: {
                    value: false,
                  },
                  22: {
                    value: false,
                  },
                },
              },
            },
          },
          exhaustion: {
            position: 'top',
            label: game.i18n.localize('Root.Sheet.NPC.Exhaustion'),
            description: null,
            customLabel: false,
            userLabel: false,
            type: 'ListMany',
            condition: false,
            options: {
              0: {
                label: '',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                  6: {
                    value: false,
                  },
                  7: {
                    value: false,
                  },
                  8: {
                    value: false,
                  },
                  9: {
                    value: false,
                  },
                  10: {
                    value: false,
                  },
                  11: {
                    value: false,
                  },
                  12: {
                    value: false,
                  },
                  13: {
                    value: false,
                  },
                  14: {
                    value: false,
                  },
                  15: {
                    value: false,
                  },
                  16: {
                    value: false,
                  },
                  17: {
                    value: false,
                  },
                  18: {
                    value: false,
                  },
                  19: {
                    value: false,
                  },
                  20: {
                    value: false,
                  },
                  21: {
                    value: false,
                  },
                  22: {
                    value: false,
                  },
                },
              },
            },
          },
          wear: {
            position: 'top',
            label: game.i18n.localize('Root.Sheet.NPC.Wear'),
            description: null,
            customLabel: false,
            userLabel: false,
            type: 'ListMany',
            condition: false,
            options: {
              0: {
                label: '',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                  6: {
                    value: false,
                  },
                  7: {
                    value: false,
                  },
                  8: {
                    value: false,
                  },
                  9: {
                    value: false,
                  },
                  10: {
                    value: false,
                  },
                  11: {
                    value: false,
                  },
                  12: {
                    value: false,
                  },
                  13: {
                    value: false,
                  },
                  14: {
                    value: false,
                  },
                  15: {
                    value: false,
                  },
                  16: {
                    value: false,
                  },
                  17: {
                    value: false,
                  },
                  18: {
                    value: false,
                  },
                  19: {
                    value: false,
                  },
                  20: {
                    value: false,
                  },
                  21: {
                    value: false,
                  },
                  22: {
                    value: false,
                  },
                },
              },
            },
          },
          morale: {
            position: 'top',
            label: game.i18n.localize('Root.Sheet.NPC.Morale'),
            description: null,
            customLabel: false,
            userLabel: false,
            type: 'ListMany',
            condition: false,
            options: {
              0: {
                label: '',
                value: false,
                values: {
                  0: {
                    value: false,
                  },
                  1: {
                    value: false,
                  },
                  2: {
                    value: false,
                  },
                  3: {
                    value: false,
                  },
                  4: {
                    value: false,
                  },
                  5: {
                    value: false,
                  },
                  6: {
                    value: false,
                  },
                  7: {
                    value: false,
                  },
                  8: {
                    value: false,
                  },
                  9: {
                    value: false,
                  },
                  10: {
                    value: false,
                  },
                  11: {
                    value: false,
                  },
                  12: {
                    value: false,
                  },
                  13: {
                    value: false,
                  },
                  14: {
                    value: false,
                  },
                  15: {
                    value: false,
                  },
                  16: {
                    value: false,
                  },
                  17: {
                    value: false,
                  },
                  18: {
                    value: false,
                  },
                  19: {
                    value: false,
                  },
                  20: {
                    value: false,
                  },
                  21: {
                    value: false,
                  },
                  22: {
                    value: false,
                  },
                },
              },
            },
          },
          inflicts: {
            position: 'left',
            label: game.i18n.localize('Root.Sheet.NPC.Inflicts'),
            description: null,
            customLabel: false,
            userLabel: false,
            type: 'LongText',
            value: '',
          },
          drive: {
            position: 'left',
            label: game.i18n.localize('Root.Sheet.NPC.Drive'),
            description: null,
            customLabel: false,
            userLabel: false,
            type: 'LongText',
            value: '',
          },
        },
        moveTypes: {
          moves: {
            label: game.i18n.localize('Root.Sheet.NPC.Moves'),
            moves: [],
          },
        },
        equipmentTypes: {
          equipment: {
            label: game.i18n.localize('Root.Sheet.Items.Equipment'),
            moves: [],
          },
        },
      },
    },
  }

  const useAdvDis = await game.settings.get('root', 'advantage')

  // Settings for Root
  await game.settings.set('pbta', 'hideRollFormula', true)
  await game.settings.set('pbta', 'hideUses', true)
  await game.settings.set('pbta', 'advForward', true)
  if (!useAdvDis) {
    await game.settings.set('pbta', 'hideForward', false)
    await game.settings.set('pbta', 'hideOngoing', false)
    await game.settings.set('pbta', 'hideRollMode', true)
  } else {
    await game.settings.set('pbta', 'hideForward', true)
    await game.settings.set('pbta', 'hideOngoing', true)
    await game.settings.set('pbta', 'hideRollMode', false)
  }
}
