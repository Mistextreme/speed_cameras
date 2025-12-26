function TriggerNotification(source, message) -- Server-side notification function
    if Config.Framework == 'esx' then
        TriggerClientEvent('esx:showNotification', source, message)
    elseif Config.Framework == 'qb-core' then
        TriggerClientEvent('QBCore:Notify', source, message, 'primary', 5000)
    end
end