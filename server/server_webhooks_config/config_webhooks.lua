Config.Webhooks = {
    -- This webhook will receive a summary of the current statistics right before the cache is refreshed.
    -- It provides a periodic snapshot of the system's activity.
    statistics = "https://discord.com/api/webhooks/1413245276067725442/XuoCvsWKHhYU7yrPG_AWnRjuQW5-labYmZa1RnU02sOXGEBSDMgTxsfMahEaPcPb4wI5",

    -- This webhook logs every time a user with permissions uses the /radarlogs command.
    -- Useful for auditing who is accessing player infraction data.
    logsAccess = "https://discord.com/api/webhooks/1413245398276902933/z29orLeV1NE0Rre4BIznhUBPzfCmWtgzuFWX-NZeUN9rYFYEXEovTcc8odbhRPZ43VXJ",

    -- This webhook logs all administrative actions related to radars and zones.
    -- It tracks creation, deletion, and modification of any speed trap.
    adminActions = "https://discord.com/api/webhooks/1413245482016440503/a0hdAJ-FUhc6lkvxoR0OzOiXswgCP2-YrHKdYWmQGu3bOCm_fJEhevg7P-aO8ZfjUb_i",

    -- This webhook logs every time a player collects fines from a radar.
    fineCollection = "https://discord.com/api/webhooks/1413629165919408259/KZ1nMxjdpa4qy1ocqryGvRLWlEy1Zh7E1gBU2UNuAYfST4Cr2YnhlLR48rcdY_lsJ3py",

    -- This webhook logs every time a player place mobile radar with saved settings.
    mobileRadarPlaced = "https://discord.com/api/webhooks/1416761368480190635/fQtuoZIGb5wZCJStWZcsKbADrzMIjisNch16oevE9_BFsVQuzSLZCNXO4-XimBCRihMr",

    -- This webhook logs every time a player edit mobile radar with saved settings.
    mobileRadarEdited = "https://discord.com/api/webhooks/1416761462910615633/F4fVAVUQPouZApKzohBTQGNtELUqsu3r_KhgTJ2UZ4VcP1t-uVBmRNfhDtrrnPCPqE0L",

    -- This webhooks logs every time a player remove mobile radar.
    mobileRadarRemoved = "https://discord.com/api/webhooks/1416762848411123802/c8m46X8y3c9wboD2EwMzF-68bQqmdOsm3b6o2RvefDUgTjLesHPZr8cpaERWlHMsO-hz",

    -- This webhooks logs every time a player collect money from mobile radar.
    mobileRadarFinesCollected = "https://discord.com/api/webhooks/1416765364808978534/73P72kj0Cvb8_fwYxl7dFBSIHHyVMnRTmHtFXdlITeOEFyaY64dkoaxZlNwsDMzt9hSh"
}