/* jshint -W014, -W033, esversion: 9 */
/* eslint-disable new-cap */
'use strict'

module.exports = class connectionAPI {
  constructor (platform, devicesInHB) {
    // Set up variables from the platform
    this.consts = platform.consts
    this.debug = platform.config.debug
    this.devicesInHB = devicesInHB
    this.funcs = platform.funcs
    this.hapChar = platform.api.hap.Characteristic
    this.hapServ = platform.api.hap.Service
    this.hapUUIDGen = platform.api.hap.uuid.generate
    this.lang = platform.lang
    this.log = platform.log
  }

  showHome () {
    let accList = ''
    const mapAsc = new Map([...this.devicesInHB.entries()].sort((a, b) => {
      return a[1].displayName.toLowerCase() > b[1].displayName.toLowerCase()
        ? 1
        : b[1].displayName.toLowerCase() > a[1].displayName.toLowerCase()
          ? -1
          : 0
    }))
    mapAsc.forEach(accessory => {
      accList += `<tr>
        <td class="small">${accessory.displayName}</td>
        <td class="small"><code>${accessory.context.hbDeviceId}</code></td>
      </tr>`
    })
    return `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-eOJMYsd53ii+scO/bJGFsiCZc+5NDVN2yr8+0RDqr0Ql0h+rP48ckxlpbzKgwra6" crossorigin="anonymous">
        <title>homebridge-ewelink API Docs</title>
      </head>
      <body>
        <div class="container-fluid mt-3">
          <div class="row content">
            <div class="col-sm-2"></div>
            <div class="col-sm-8">
              <p class="text-center">
                <img src="https://user-images.githubusercontent.com/43026681/101325266-63126600-3863-11eb-9382-4a2924f0e540.png" alt="homebridge-ewelink logo" style="width: 60%;">
                <h4 class="text-center">homebridge-ewelink</h3>
              </p>
              <hr class="mb-0">
              <h5 class="mt-4 mb-2">API Docs</h5>
              <ul class="small">
                <li>All requests are of type <code>GET</code></li>
                <li>All requests will return a <code>HTTP 200 OK</code> success code</li>
                <li>All requests will return a JSON response</li>
                <li>Success or failure of any request can be determined by the <code>success</code> response property which will be <code>true</code> or <code>false</code></li>
                <li>Any error will be returned in an <code>error</code> parameter as a <code>string</code></li>
                <li>Supported devices are currently:
                  <ul>
                    <li>Switches</li>
                    <li>Outlets</li>
                    <li>Lights</li>
                  </ul>
                </li>
              </ul>
              <h5 class="mt-4 mb-2">Available Commands</h5>
              <div class="table-responsive">
              <table class="table table-sm table-hover">
                <thead>
                  <tr>
                    <th scope="col" class="small" style="width: 50%;">Function</th>
                    <th scope="col" class="small" style="width: 50%;">Path</th>
                  </tr>
                </thead>
                <tbody>
                <tr>
                  <td class="small">
                    Query the <code>on</code>/<code>off</code> state.<br>
                    Example response:<br>
                    <code>{"success":true,"response":"on"}</code>
                  </td>
                  <td class="align-middle small"><code>/{hbDeviceId}/get/state</code></td>
                </tr>
                <tr>
                  <td class="small">
                    Query the brightness between <code>0</code>% and <code>100</code>%.<br>
                    Example response:<br>
                    <code>{"success":true,"response":34}</code>
                  </td>
                  <td class="align-middle small"><code>/{hbDeviceId}/get/brightness</code></td>
                </tr>
                <tr>
                  <td class="small">
                    Set the state to <code>on</code>.<br>
                    Example response:<br>
                    <code>{"success":true}</code>
                  </td>
                  <td class="align-middle small"><code>/{hbDeviceId}/set/state/on</code></td>
                </tr>
                <tr>
                  <td class="small">
                    Set the state to <code>off</code>.<br>
                    Example response:<br>
                    <code>{"success":true}</code>
                  </td>
                  <td class="align-middle small"><code>/{hbDeviceId}/set/state/off</code></td>
                </tr>
                <tr>
                  <td class="small">
                    Switch (<code>toggle</code>) the current state.<br>
                    Example response:<br>
                    <code>{"success":true}</code>
                  </td>
                  <td class="align-middle small"><code>/{hbDeviceId}/set/state/toggle</code></td>
                </tr>
                <tr>
                  <td class="small">
                    Set the brightness between <code>0</code>% and <code>100</code>%.<br>
                    Example response:<br>
                    <code>{"success":true}</code>
                  </td>
                  <td class="align-middle small"><code>/{hbDeviceId}/set/brightness/54</code></td>
                </tr>
                </tbody>
              </table>
              </div>
              <h5 class="mt-4 mb-2">Accessory List</h5>
              <div class="table-responsive">
              <table class="table table-sm table-hover">
                <thead>
                  <tr>
                    <th scope="col" class="small" style="width: 50%;">Accessory Name</th>
                    <th scope="col" class="small" style="width: 50%;">HB Device ID</th>
                  </tr>
                </thead>
                <tbody>
                  ${accList}
                </tbody>
              </table>
              </div>
            </div>
            <div class="col-sm-2"></div>
          </div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/js/bootstrap.bundle.min.js" integrity="sha384-JEW9xMcG8R+pH31jmWH6WWP0WintQrMb4s7ZOdauHnUtxwoG2vI5DkLtS3qm9Ekf" crossorigin="anonymous"></script>
      </body>
    </html>`
  }

  async action (url) {
    const pathParts = url.split('/')
    const device = pathParts[1]
    const action = pathParts[2]
    const attribute = pathParts[3]
    const newStatus = pathParts[4]
    if (!device) {
      throw new Error('No accessory specified')
    }
    const uuid = this.hapUUIDGen(device)
    if (!this.devicesInHB.has(uuid)) {
      throw new Error('Accessory not found in Homebridge')
    }
    if (!action) {
      throw new Error('No action specified')
    }
    if (!['get', 'set'].includes(action)) {
      throw new Error("Action must be 'get' or 'set'")
    }
    if (!attribute) {
      throw new Error('No attribute specified')
    }
    if (!['state', 'brightness'].includes(attribute)) {
      throw new Error("Attribute must be 'state' or 'brightness'")
    }
    if (action === 'set') {
      if (!newStatus) {
        throw new Error('No new status specified')
      }
    }
    const accessory = this.devicesInHB.get(uuid)
    if (!accessory.control) {
      throw new Error('Accessory has not been initialised yet')
    }

    let service
    let charName

    switch (attribute) {
      case 'state':
        service = accessory.getService(this.hapServ.Switch) ||
          accessory.getService(this.hapServ.Outlet) ||
          accessory.getService(this.hapServ.Lightbulb)
        if (service) {
          charName = service.testCharacteristic(this.hapChar.On)
            ? this.hapChar.On
            : false
        }
        break
      case 'brightness':
        service = accessory.getService(this.hapServ.Lightbulb)
        if (service) {
          charName = service.testCharacteristic(this.hapChar.Brightness)
            ? this.hapChar.Brightness
            : false
        }
        break
    }

    if (!charName) {
      throw new Error("Accessory does not support attribute '" + attribute + "'")
    }

    const currentHKStatus = service.getCharacteristic(charName).value

    if (action === 'get') {
      switch (attribute) {
        case 'state':
          return service.getCharacteristic(charName).value ? 'on' : 'off'
        case 'brightness':
          return service.getCharacteristic(charName).value
      }
    }

    if (action === 'set') {
      let newHKStatus
      switch (attribute) {
        case 'state':
          switch (newStatus) {
            case 'on':
              newHKStatus = true
              break
            case 'off':
              newHKStatus = false
              break
            case 'toggle':
              newHKStatus = !currentHKStatus
              break
            default:
              throw new Error(
                "New status must be 'on', 'off' or 'toggle' for attribute:state"
              )
          }
          if (!accessory.control.internalStateUpdate) {
            throw new Error('Function to control accessory not found')
          }
          await accessory.control.internalStateUpdate(newHKStatus)
          break
        case 'brightness': {
          newHKStatus = parseInt(newStatus)
          if (isNaN(newHKStatus) || newHKStatus < 0 || newHKStatus > 100) {
            throw new Error(
              'New status must be integer 0-100 for attribute:brightness'
            )
          }
          if (!accessory.control.internalBrightnessUpdate) {
            throw new Error('Function to control accessory not found')
          }
          await accessory.control.internalBrightnessUpdate(newHKStatus)
          break
        }
      }
      // service.setCharacteristic(charName, newHKStatus)
      service.updateCharacteristic(charName, newHKStatus)
    }
  }
}