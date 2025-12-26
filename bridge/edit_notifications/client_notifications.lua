function TriggerNotification(message, type)
    if not message then return end

    if Config.Framework == 'esx' then
        local msgType = 'inform'
        if type == 'error' then msgType = 'error' end
        if type == 'success' then msgType = 'success' end
        
        ESX.ShowNotification(message, msgType, 5000)

    elseif Config.Framework == 'qb-core' then
        QBCore.Functions.Notify(message, type or 'primary', 5000)
    end
end

-- This export below please leave it.
exports('TriggerNotification', TriggerNotification)