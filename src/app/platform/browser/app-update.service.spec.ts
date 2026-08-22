import {TestBed} from '@angular/core/testing'
import {SwUpdate, VersionEvent} from '@angular/service-worker'
import {Subject} from 'rxjs'

import {AppUpdateService} from './app-update.service'

describe('AppUpdateService', () => {
  const versionUpdates = new Subject<VersionEvent>()
  const swUpdate = {
    isEnabled: true,
    versionUpdates,
    checkForUpdate: vi.fn().mockResolvedValue(false),
  }

  beforeEach(() => {
    swUpdate.checkForUpdate.mockReset()
    swUpdate.checkForUpdate.mockResolvedValue(false)
    TestBed.configureTestingModule({
      providers: [{provide: SwUpdate, useValue: swUpdate}],
    })
  })

  it('shows the notice when a new version is ready and allows dismissing it', () => {
    const service = TestBed.inject(AppUpdateService)

    versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: {hash: 'current'},
      latestVersion: {hash: 'latest'},
    })

    expect(service.updateAvailable()).toBe(true)
    service.dismiss()
    expect(service.updateAvailable()).toBe(false)
  })

  it('exposes the manual check state and ignores a concurrent request', async () => {
    const service = TestBed.inject(AppUpdateService)
    await vi.waitFor(() => expect(service.checking()).toBe(false))

    let finishCheck!: (updateFound: boolean) => void
    swUpdate.checkForUpdate.mockImplementationOnce(() => new Promise(resolve => finishCheck = resolve))

    const request = service.checkForUpdate()
    expect(service.checking()).toBe(true)

    await service.checkForUpdate()
    expect(swUpdate.checkForUpdate).toHaveBeenCalledTimes(2)

    finishCheck(false)
    await request
    expect(service.checking()).toBe(false)
  })
})
