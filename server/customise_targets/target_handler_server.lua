local Framework = nil

Citizen.CreateThread(function()
    while Framework == nil do
        Citizen.Wait(500)
        local success, fw = pcall(function() return exports.intersystems_speed_cameras:GetFrameworkObject() end)
        if success and fw then Framework = fw end
    end
    
    if Config.Targets_mobile.System == 'none' then
        return
    end
end)

RegisterNetEvent('intersystems_speedcams:server:getMobileRadarFromTrunk', function()
    if Config.Targets_mobile.System == 'none' then return end
    local src = source
    if Framework == nil then return end
    local player = Framework.GetPlayer(src)
    if not player then return end
    local playerJob = Framework.GetPlayerJob(player)
    if not playerJob or not playerJob.name or not Config.TemporaryRadars.RequiredJobs[playerJob.name] then
        return
    end
    
    if Config.Targets_mobile.RequireItem then
        if Framework.GetInventoryItemCount(player, Config.TemporaryRadars.ItemName) > 0 then
            TriggerClientEvent('intersystems_speedcams:client:takenFromTrunk', src)
        else
            local Notifications = exports.intersystems_speed_cameras:GetNotifications()
            TriggerNotification(src, Notifications.you_dont_have_item_mobile or "You do not have a mobile camera kit")
        end
    else
        TriggerClientEvent('intersystems_speedcams:client:takenFromTrunk', src)
    end
end)

RegisterNetEvent('intersystems_speedcams:server:returnMobileRadarToTrunk', function()
    if Config.Targets_mobile.System == 'none' then return end

    local src = source
    if Framework == nil then return end

    local player = Framework.GetPlayer(src)
    if not player then return end

    local hasReturned = false

    if Config.Targets_mobile.RequireItem then
        if Framework.GetInventoryItemCount(player, Config.TemporaryRadars.ItemName) > 0 then
            Framework.RemoveInventoryItem(player, Config.TemporaryRadars.ItemName, 1)
            hasReturned = true
        else
            TriggerNotification(src, Notifications.mobile_camera_no_longer)
        end
    else
        hasReturned = true
    end

    if hasReturned then
        TriggerNotification(src, Notifications.mobile_camera_back)
        TriggerClientEvent('intersystems_speedcams:client:returnedToTrunk', src)
    end
end)