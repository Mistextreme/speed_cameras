Framework = {}

Framework.Players = {}

if Config.Framework == 'esx' then
    ESX = exports['es_extended']:getSharedObject()

    Framework.GetPlayer = function(source)
        return ESX.GetPlayerFromId(source)
    end
    Framework.GetPlayerIdentifier = function(player)
        return player.identifier
    end
    Framework.GetPlayerJob = function(player)
        return player.job
    end
    Framework.GetPlayerName = function(player)
        return player.getName()
    end
    Framework.GetPlayerFromIdentifier = function(identifier)
        return ESX.GetPlayerFromIdentifier(identifier)
    end
    Framework.IsAdmin = function(player)
        if not player then 
            if Config.DebugCreatingObjectPermissions then
                print('^1[SpeedRadar ERROR] Framework.IsAdmin received nil player.^0')
            end
            return false 
        end

        local src = player.source
        local group = "NONE"
        
        if player.getGroup then 
            group = player.getGroup() 
        elseif player.group then 
            group = player.group 
        end

        local hasAce = IsPlayerAceAllowed(src, "radarsystem.admin")
        
        if Config.DebugCreatingObjectPermissions then
            print(string.format('^3[SpeedRadar DEBUG] ID: %s | Group: %s | ACE: %s^0', tostring(src), tostring(group), tostring(hasAce)))
        end

        if hasAce then 
            if Config.DebugCreatingObjectPermissions then
                print('^2[SpeedRadar DEBUG] Access granted via ACE permission.^0')
            end
            return true 
        end

        if group == 'admin' or group == 'superadmin' or group == 'owner' or group == '_dev' or group == 'project_manager' then 
            if Config.DebugCreatingObjectPermissions then
                print('^2[SpeedRadar DEBUG] Access granted via Group ('..tostring(group)..').^0')
            end
            return true 
        end

        if Config.DebugCreatingObjectPermissions then
            print('^1[SpeedRadar DEBUG] Access DENIED. Player has no valid group or ACE permission.^0')
        end
        return false
    end
    Framework.RemoveMoney = function(player, amount, type)
        if type == 'bank' then player.removeAccountMoney('bank', amount)
        else player.removeMoney(amount) end
    end
    Framework.AddMoney = function(player, amount, type)
        if type == 'bank' then player.addAccountMoney('bank', amount)
        else player.addMoney(amount) end
    end
    Framework.RegisterCommand = function(command, permission, callback)
        ESX.RegisterCommand(command, permission, function(xPlayer, args, showError)
            callback(xPlayer.source, args, showError)
        end, false)
    end
    
    AddEventHandler('esx:playerLoaded', function(playerId, xPlayer)
        Framework.Players[playerId] = xPlayer
    end)
    
    AddEventHandler('esx:playerDropped', function(playerId, reason)
        Framework.Players[playerId] = nil
    end)

    Framework.GetInventoryItemCount = function(player, itemName)
        local item = player.getInventoryItem(itemName)
        return item and item.count or 0
    end
    Framework.RemoveInventoryItem = function(player, itemName, amount)
        player.removeInventoryItem(itemName, amount)
    end
    Framework.AddInventoryItem = function(player, itemName, amount)
        player.addInventoryItem(itemName, amount)
    end
    Framework.PlayerDroppedEvent = 'esx:playerDropped'

elseif Config.Framework == 'qb-core' then
    QBCore = exports['qb-core']:GetCoreObject()

    Framework.GetPlayer = function(source)
        local Player = QBCore.Functions.GetPlayer(source)
        if Player then
            Player.source = Player.PlayerData.source 
        end
        return Player
    end

    Framework.GetPlayerIdentifier = function(player)
        if not player then return nil end
        return player.PlayerData.citizenid
    end
    
    Framework.GetPlayerJob = function(player)
        if not player then return nil end
        return player.PlayerData.job
    end

    Framework.GetPlayerName = function(player)
        if not player then return "Nezinomas" end
        return player.PlayerData.charinfo.firstname .. ' ' .. player.PlayerData.charinfo.lastname
    end

    Framework.IsAdmin = function(player)
        if not player or not player.PlayerData then
            return false
        end
        
        local source = player.PlayerData.source
        local hasAcePermission = IsPlayerAceAllowed(source, "radarsystem.admin")
        
        return hasAcePermission
    end

    Framework.RemoveMoney = function(player, amount, type)
        if not player then return end
        local accountType = type or 'bank'
        player.Functions.RemoveMoney(accountType, amount, "fine")
    end

    Framework.AddMoney = function(player, amount, type)
        if not player then return end
        local accountType = type or 'bank'
        player.Functions.AddMoney(accountType, amount)
    end

    Framework.GetPlayerFromIdentifier = function(identifier)
        local Player = QBCore.Functions.GetPlayerByCitizenId(identifier)
        if Player then
            Player.source = Player.PlayerData.source
        end
        return Player
    end

    Framework.RegisterCommand = function(command, permission, callback)
        QBCore.Commands.Add(command, "Admin command for radars", {}, false, function(source, args)
            callback(source, args)
        end, permission)
    end

    Framework.GetInventoryItemCount = function(player, itemName)
        if not player then return 0 end
        local item = player.Functions.GetItemByName(itemName)
        return item and item.amount or 0
    end

    Framework.RemoveInventoryItem = function(player, itemName, amount)
        if not player then return end
        player.Functions.RemoveItem(itemName, amount)
    end

    Framework.AddInventoryItem = function(player, itemName, amount)
        if not player then return end
        player.Functions.AddItem(itemName, amount)
    end
    
    Framework.PlayerDroppedEvent = 'QBCore:Server:PlayerDropped'
end

exports('GetFrameworkObject', function()
    return Framework
end)