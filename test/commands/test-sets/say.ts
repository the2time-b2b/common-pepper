export default {
  "validCommandList": [
    "this is a test message every 1:0:0 on channel named task-name",
    "this is a another test message every 30:0 on channel named task-name2",
    "this is a yet another test message every 60 on channel named task-name3"
  ],
  "commandInfoList": [
    "help",
    "usage",
    "modify",
    "example",
    "message",
    "channel"
  ],
  "invalidCommandList": [
    "every 1:0:0 on channel named task-name",
    "this is a test message",
    "every 1:0:0",
    "on channel",
    "named task-name",
    "this is a test message every on named",
    "every on named"
  ],
  "invalidIntervalList": [
    "1:0:0:0",
    "a:b:c",
    "-1:0:0",
    "1:0:b",
    "1.5:0:0",
    ":::",
    "1::",
    "1:0:",
    ":",
    "1:0:0:"
  ],
  "invalidChannelList": [
    "jim",
    "justin-tv",
    "thisis26chartwitchusername"
  ],
  "invalidTaskNameList": [
    "tn",
    "thisisaunnecessaryforty1charactertaskname"
  ],
  "invalidModifyCommandList": [
    "modify task-name",
    "modify task-name say",
    "modify task-name every",
    "modify task-name on",
    "modify task-name named"
  ],
  "invalidTaskListStructs": [
    [],
    [
      []
    ],
    {
      "task-name": []
    },
    [
      {
        "invalidLevel": {
          "task-name": {
            "totalWaitInterval": 3600,
            "channel": "channel",
            "taskMessage": "this is a test message"
          }
        }
      }
    ],
    [
      {
        "task-name": [
          {
            "totalWaitInterval": 3600
          },
          {
            "channel": "channel"
          },
          {
            "taskMessage": "this is a test message"
          }
        ]
      }
    ],
    [
      {
        "task-name": [
          [
            "totalWaitInterval",
            3600
          ],
          [
            "channel",
            "channel"
          ],
          [
            "taskMessage",
            "this is a test message"
          ]
        ]
      }
    ],
    [
      [
        {
          "task-name": {
            "totalWaitInterval": 3600,
            "channel": "channel",
            "taskMessage": "this is a test message"
          }
        }
      ]
    ],
    {
      "task-name": {
        "totalWaitInterval": 3600,
        "channel": "channel",
        "taskMessage": "this is a test message"
      }
    },
    {
      "totalWaitInterval": 3600,
      "channel": "channel",
      "taskMessage": "this is a test message"
    },
    // Name of the keys for each task object is changed.
    [
      {
        "task-name": {
          "time": 3600,
          "channel": "channel",
          "taskMessage": "this is a test message"
        }
      }
    ],
    [
      {
        "task-name": {
          "totalWaitInterval": 3600,
          "username": "channel",
          "taskMessage": "this is a test message"
        }
      }
    ],
    [
      {
        "task-name": {
          "totalWaitInterval": 3600,
          "channel": "channel",
          "message": "this is a test message"
        }
      }
    ],
    // Task names with invalid character length.
    [
      {
        "task-name": {
          "totalWaitInterval": 3600,
          "channel": "channel",
          "taskMessages": "this is a test message"
        }
      },
      {
        "tn": {
          "totalWaitInterval": 3600,
          "channel": "channel",
          "taskMessage": "this is a test message"
        }
      }
    ],
    [
      {
        "task-name": {
          "totalWaitInterval": 3600,
          "channel": "channel",
          "taskMessages": "this is a test message"
        }
      },
      {
        "thisisaunnecessaryforty1charactertaskname": {
          "totalWaitInterval": 3600,
          "channel": "channel",
          "taskMessage": "this is a test message"
        }
      }
    ],
    // Channel names with invalid characters and character length.
    [
      {
        "task-name": {
          "totalWaitInterval": 3600,
          "channel": "jim",
          "taskMessage": "this is a test message"
        }
      }
    ],
    [
      {
        "task-name": {
          "totalWaitInterval": 3600,
          "channel": "justin-tv",
          "taskMessage": "this is a test message"
        }
      }
    ],
    [
      {
        "task-name": {
          "totalWaitInterval": 3600,
          "channel": "thisis26chartwitchusername",
          "taskMessage": "this is a test message"
        }
      }
    ],
    // Tasks not containing valid number of attributes.
    [
      {
        "task-name": {
          "channel": "channel",
          "taskMessage": "this is a test message"
        }
      }
    ],
    [
      {
        "task-name": {
          "channel": "channel",
          "taskMessage": "this is a test message"
        }
      },
      {
        "another-task-name": {
          "totalWaitInterval": 3600,
          "channel": "channel",
          "taskMessage": "this is a test message"
        }
      }
    ],
    [
      {
        "task-name": {
          "totalWaitInterval": 3600,
          "channel": "channel",
          "taskMessage": "this is a test message"
        }
      },
      {
        "task-name": {
          "channel": "channel",
          "taskMessage": "this is a test message"
        }
      }
    ],
    [
      {
        "task-name": {
          "totalWaitInterval": 3600,
          "taskMessage": "this is a test message"
        }
      }
    ],
    [
      {
        "task-name": {
          "totalWaitInterval": 3600,
          "taskMessage": "this is a test message"
        }
      },
      {
        "task-name": {
          "totalWaitInterval": 3600,
          "channel": "channel",
          "taskMessage": "this is a test message"
        }
      }
    ],
    [
      {
        "task-name": {
          "totalWaitInterval": 3600,
          "channel": "channel",
          "taskMessage": "this is a test message"
        }
      },
      {
        "task-name": {
          "totalWaitInterval": 3600,
          "taskMessage": "this is a test message"
        }
      }
    ],
    [
      {
        "task-name": {
          "totalWaitInterval": 3600,
          "channel": "channel"
        }
      }
    ],
    [
      {
        "task-name": {
          "totalWaitInterval": 3600,
          "channel": "channel"
        }
      },
      {
        "task-name": {
          "totalWaitInterval": 3600,
          "channel": "channel",
          "taskMessage": "this is a test message"
        }
      }
    ],
    [
      {
        "task-name": {
          "totalWaitInterval": 3600,
          "channel": "channel",
          "taskMessage": "this is a test message"
        }
      },
      {
        "task-name": {
          "totalWaitInterval": 3600,
          "channel": "channel"
        }
      }
    ],
    [
      {
        "task-name": {
          "interval": 3600,
          "totalWaitInterval": 3600,
          "channel": "channel",
          "taskMessage": "this is a test message"
        }
      }
    ],
    [
      {
        "task-name": {
          "totalWaitInterval": 3600,
          "channel": "channel",
          "username": "channel",
          "taskMessage": "this is a test message"
        }
      }
    ],
    /*
      Due to the nature of the attribute 'taskMessage' of the JSON DB,
      supporting 'double quotations' inside the regular expressions causes
      problems upon validation as 'taskMessage' values includes anything (.*)
      within 'double quotes' in the regular expression. If two or more attribute
      follows the 'taskMessage' attribute whose values is also contained inside
      of the 'double quotes', are considered as valid since those attributes
      also ends with its own 'double quotes'. This makes the regex check think
      that anything between the starting double quotes of 'taskMessage'
      attribute and ending double quotes of some other attribute after
      'taskMessage' is part of the 'taskMessage' attribute's value itself.

      Therefore,
                     v
      "taskMessage": "someValue",
      "otherAttribute": "some value",
      'someOtherAttribute': "some value"
                                       ^
      is also considered as a valid string and passes the regex match.
      Hence, only allow  escaped double quotations as it is automatically done
      by the JSON library when calling it's 'stringify' method.
    */
    [
      {
        "task-name": {
          "totalWaitInterval": 3600,
          "channel": "channel",
          "taskMessage": "this is a test message",
          "message": "this is a test message"
        }
      }
    ]
  ]
};
