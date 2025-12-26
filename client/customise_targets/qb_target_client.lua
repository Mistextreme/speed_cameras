local Config = exports.intersystems_speed_cameras:GetConfig()

if Config.Targets_mobile.System ~= 'qb_target' then
    return
end

local isHoldingRadarFromTrunk = false
local isAnimationPlaying = false

local function PlayTrunkAnimation(vehicle, callback)
    if isAnimationPlaying then return end
    isAnimationPlaying = true

    local playerPed = PlayerPedId()
    SetVehicleDoorOpen(vehicle, 5, false, false)
    Citizen.Wait(500)
    local min, max = GetModelDimensions(GetEntityModel(vehicle))
    local trunkCoords = GetOffsetFromEntityInWorldCoords(vehicle, 0.0, min.y - 0.5, 0.7)

    TaskGoToCoordAnyMeans(playerPed, trunkCoords.x, trunkCoords.y, trunkCoords.z, 1.0, 0, false, 786603, 0xbf800000)
    Citizen.Wait(1000)

    local animDict = "anim@gangops@facility@servers@bodysearch@"
    local animName = "player_search"
    RequestAnimDict(animDict)
    while not HasAnimDictLoaded(animDict) do Citizen.Wait(50) end
    
    TaskPlayAnim(playerPed, animDict, animName, 8.0, -8.0, -1, 49, 0, false, false, false)
    
    Framework.ShowNotification(Notifications.mobile_camera_checking_trunk, "info", 4000)
    Citizen.Wait(4000)

    if callback then
        callback()
    end

    ClearPedTasks(playerPed)
    SetVehicleDoorShut(vehicle, 5, true)
    
    isAnimationPlaying = false
end

Citizen.CreateThread(function()
    while not exports['qb-target'] do Citizen.Wait(500) end
    while not exports.intersystems_speed_cameras do Citizen.Wait(500) end
    if not Config.TemporaryRadars.Enabled then return end

    local policeVehicles = {}
    if Config.SirenImmunityWhitelist and Config.SirenImmunityWhitelist.police then
        for _, modelName in ipairs(Config.SirenImmunityWhitelist.police) do
            table.insert(policeVehicles, modelName) 
        end
    end
    if #policeVehicles == 0 then return end

    local requiredJobs = {}
    for jobName, _ in pairs(Config.TemporaryRadars.RequiredJobs) do
        requiredJobs[jobName] = true
    end

    local trunkTargetOptions = {
        {
            label = 'Take the mobile radar',
            icon = 'fas fa-camera-retro',
            action = function(entity)
                PlayTrunkAnimation(entity, function()
                    TriggerServerEvent('intersystems_speedcams:server:getMobileRadarFromTrunk')
                end)
            end,
            canInteract = function()
                if isHoldingRadarFromTrunk or isAnimationPlaying then return false end
                local playerData = Framework.GetPlayerData()
                return playerData and playerData.job and requiredJobs[playerData.job.name]
            end,
        },
        {
            label = 'Put the radar back',
            icon = 'fas fa-upload',
            action = function(entity)
                PlayTrunkAnimation(entity, function()
                    TriggerServerEvent('intersystems_speedcams:server:returnMobileRadarToTrunk')
                end)
            end,
            canInteract = function()
                if not isHoldingRadarFromTrunk or isAnimationPlaying then return false end
                local playerData = Framework.GetPlayerData()
                return playerData and playerData.job and requiredJobs[playerData.job.name]
            end,
        }
    }

    exports['qb-target']:AddTargetModel(policeVehicles, {
        options = trunkTargetOptions,
        distance = 1.5
    })

end)

RegisterNetEvent('intersystems_speedcams:client:takenFromTrunk', function()
    isHoldingRadarFromTrunk = true
    TriggerEvent('trikojis:client:startPlacement')
end)

RegisterNetEvent('intersystems_speedcams:client:returnedToTrunk', function()
    isHoldingRadarFromTrunk = false
end)

AddEventHandler('trikojis:client:saveSuccess', function(isPlacement)
    if isPlacement and isHoldingRadarFromTrunk then
        isHoldingRadarFromTrunk = false
    end
end)