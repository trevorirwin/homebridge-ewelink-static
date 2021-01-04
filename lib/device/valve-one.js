/* jshint -W014, -W033, esversion: 9 */
/* eslint-disable new-cap */
'use strict'
module.exports = class deviceValveOne {
  constructor (platform, accessory) {
    this.platform = platform
    this.log = platform.log
    this.helpers = platform.helpers
    this.Service = platform.api.hap.Service
    this.Characteristic = platform.api.hap.Characteristic
    if (!(this.valveService = accessory.getService(this.Service.Valve))) {
      this.valveService = accessory.addService(this.Service.Valve)
      this.valveService
        .setCharacteristic(this.Characteristic.Active, 0)
        .setCharacteristic(this.Characteristic.InUse, 0)
        .setCharacteristic(this.Characteristic.ValveType, 1)
        .setCharacteristic(this.Characteristic.SetDuration, 120)
        .addCharacteristic(this.Characteristic.RemainingDuration)
    }
    this.valveService
      .getCharacteristic(this.Characteristic.Active)
      .on('set', this.internalUpdate.bind(this))
    this.valveService
      .getCharacteristic(this.Characteristic.SetDuration)
      .on('set', (value, callback) => {
        if (this.valveService.getCharacteristic(this.Characteristic.InUse).value === 1) {
          this.valveService.updateCharacteristic(this.Characteristic.RemainingDuration, value)
          clearTimeout(this.timer)
          this.timer = setTimeout(
            () => this.valveService.setCharacteristic(this.Characteristic.Active, 0),
            value * 1000
          )
        }
        callback()
      })
    this.accessory = accessory
  }

  async internalUpdate (value, callback) {
    try {
      callback()
      const params = { switch: value ? 'on' : 'off' }
      this.valveService.updateCharacteristic(this.Characteristic.InUse, value)
      switch (value) {
        case 0:
          this.valveService.updateCharacteristic(this.Characteristic.RemainingDuration, 0)
          clearTimeout(this.timer)
          this.log('[%s] current state [stopped].', this.accessory.displayName)
          break
        case 1: {
          const timer = this.valveService.getCharacteristic(this.Characteristic.SetDuration).value
          this.valveService.updateCharacteristic(this.Characteristic.RemainingDuration, timer)
          this.log('[%s] current state [watering].', this.accessory.displayName)
          this.timer = setTimeout(() => {
            this.valveService.setCharacteristic(this.Characteristic.Active, 0)
          }, timer * 1000)
          break
        }
      }
      await this.platform.sendDeviceUpdate(this.accessory, params)
    } catch (err) {
      this.platform.deviceUpdateError(this.accessory, err, true)
    }
  }

  async externalUpdate (params) {
    try {
      if (!params.switch) return
      if (params.switch === 'on') {
        if (this.valveService.getCharacteristic(this.Characteristic.Active).value === 0) {
          const timer = this.valveService.getCharacteristic(this.Characteristic.SetDuration).value
          this.valveService
            .updateCharacteristic(this.Characteristic.Active, 1)
            .updateCharacteristic(this.Characteristic.InUse, 1)
            .updateCharacteristic(this.Characteristic.RemainingDuration, timer)
          if (params.updateSource) this.log('[%s] current state [watering].', this.accessory.displayName)
          this.timer = setTimeout(() => {
            this.valveService.setCharacteristic(this.Characteristic.Active, 0)
          }, timer * 1000)
        }
        return
      }
      this.valveService
        .updateCharacteristic(this.Characteristic.Active, 0)
        .updateCharacteristic(this.Characteristic.InUse, 0)
        .updateCharacteristic(this.Characteristic.RemainingDuration, 0)
      clearTimeout(this.timer)
    } catch (err) {
      this.platform.deviceUpdateError(this.accessory, err, false)
    }
  }
}