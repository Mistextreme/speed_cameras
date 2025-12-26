if Config.Framework == 'esx' then
    Citizen.CreateThread(function()
        while ESX == nil do
            TriggerEvent('esx:getSharedObject', function(obj) ESX = obj end)
            Citizen.Wait(100)
        end
        while not ESX.IsPlayerLoaded() do
            Citizen.Wait(100)
        end
        Framework.PlayerData = ESX.GetPlayerData()
    end)

    RegisterNetEvent('esx:playerLoaded', function(playerData)
        Framework.PlayerData = playerData
    end)

    RegisterNetEvent('esx:setJob', function(job)
        Framework.PlayerData.job = job
    end)

    Framework.GetPlayerData = function()
        return Framework.PlayerData
    end

    Framework.ShowNotification = function(msg)
        ESX.ShowNotification(msg)
    end

    Framework.IsAdmin = function(playerData)
      if not playerData or not playerData.group then return false end
        return playerData.group == 'admin'
    end

elseif Config.Framework == 'qb-core' then
    local QBCore = exports['qb-core']:GetCoreObject()
    Framework.PlayerData = {}

    RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
        Framework.PlayerData = QBCore.Functions.GetPlayerData()
    end)

    RegisterNetEvent('QBCore:Player:SetPlayerData', function(playerData)
        Framework.PlayerData = playerData
    end)

    Framework.GetPlayerData = function()
        return QBCore.Functions.GetPlayerData()
    end

    Framework.ShowNotification = function(msg)
        QBCore.Functions.Notify(msg, 'primary', 5000)
    end

    Framework.IsAdmin = function(playerData)
        if not playerData or not playerData.permission then return false end
        return playerData.permission == 'admin' or playerData.permission == 'admin'
    end
end

exports('GetFrameworkObject', function() return Framework end)