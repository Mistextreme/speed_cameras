## 1.1.1
1. Added missed database file in [database] folder of i_radar_templates.

## 1.1.0
1. Added database_items.sql to the [database] folder and items.png to the [items] folder for users of ox_inventory who need instructions on how to add items (as many people requested this).
2. Fixed an issue where, on some servers, objects would not spawn after a server restart.
3. Removed the black screen in the UI that appeared when the confirmation window popped up.
4. Added emergency_database.sql due to Linux users being unable to edit/write in auto-generated files (see configuration in config.lua).
5. Fixed an issue where deleted objects remained visible until the player stayed in the same spot. They now disappear instantly.
6. Added functionality to remove, add, and edit object placements.
7. Added a more advanced update notification system for a better experience.
8. Fixed numerous small issues.
9. Fixed and updated the UI design.

## 1.0.9
1. Fixed the issue where all passengers in the car would receive a fine when the speed limit was exceeded.

## 1.0.8

1. Added in Violations Logs → Statistics:
1.1 | Top 10 Radars (by Fines)
1.2 | Today's Earnings
2. Slightly changed how menus open.
3. Updated System Administration menu. Now, in the created speed cameras list, you can see how they are effectively functioning.
4. Added a temporary speed camera on/off function. Now, if you have a server meeting or need to disable them temporarily, you can do so easily.
5. Created radar templates. You can now create radars quickly and easily.
6. Added ox_target & qb_target support for mobile radars to pick up from police vehicle trunks.
7. Added a safe placement distance check for mobile radars.

## Changes has been made in config.lua & locales/*
# [config.lua]
# [index.html]
# [script.js]
# [style.css]
# [locales/*]

## 1.0.7

1. Added esx_billing as requested. (SILENT UPDATE WAS)
2. Added Copy/Paste speed cameras settings.
3. Fixed /radarlogs access by job & grade.
4. Added for ESX Framework - AutomaticlyCollectSociety = false, <-- Please check in Config.FineCollection
5. (ESX) Fixed billing method, now if set billing both sides as:
Config.FinePaymentMethod = 'billing' &
Config.FineCollection = {
    CollectionMethod = 'billing',
}

in society money appears only then player pays they billings, no need go and collect money from objects, they just won't shows up to collect. (Before issue was, if set boh billing, so player pays they billings for speeding, and if police collect money from objects, after restart they get that money in society.)

6. (ESX) Now if Config.FinePaymentMethod = 'bank' or 'cash' &
Config.FineCollection = {
    CollectionMethod = 'billing',
}

it will automaticly for speeding fines sends to society instantly.

## Changes has been made in config.lua & locales/*
# [config.lua]
# [locales/*]
# [script.js]

## 1.0.6

1. Added a police anti-radar detector – now they can catch players using anti-radar devices!
2. Anti-radar & police anti-radar: when you open the game menu, the UI now hidden.
3. In the /eRadar menu, players with the Police job can see an extra button to modify police anti-radar detector positions.
4. Added an extra function in the /eRadar menu to enable a dummy anti-radar for positioning purposes.
5. Multi-language support added. You can now create a file with your own language, and after an update, simply add your language file.
6. Optimised inventory pictures.

## Changes has been made in index.html & notifications.lua & script.js & style.css & config.lua & [img.png] folder.
# [script.js]
# [style.css]
# [config.lua]
# [notifications.lua]
# [index.html]
# [[database]/[item.png]]

## 1.0.5

1. Updated antiradar display & new looks.
2. Now items you can use from inventory.
3. Added one missed text translation in notifications.lua
4. Most wanted racer. If player has speeds more as you set in config.lua from Config.WantedRacer, police will start see blip of that player for short time.
5. Added tooltips in /radarAdmin menu.

## Changes has been made in index.html & notifications.lua & script.js & style.css & config.lua & [img.png] folder.
# [script.js]
# [style.css]
# [config.lua]
# [notifications.lua]
# [index.html]
# [[database]/[item.png]]

## 1.0.4

1. Fixed qb-core framework not recognise admins. Please read in [shared] folder Readme.md instructions.
2. Fixed issue when you creating average speed zone and trying to place 1 object, it has detect as placed 2 objects.

## 1.0.3

1. Added in statistics "Top 10 Officers (Mobile Radars)"
2. Created for statistics of Top 10 Officers (Mobile Radars) the extra database [extra_i_speeding_infractions.sql]. Check this in [database] folder.
3. Fixed issue with Mobile Radar configuration set/edit values & update values.
4. Added For Mobile radars a webhooks, you will find at [server_webhooks_config] folder.

## Changes has been made in script.js & server_webhook_config.lua
# [script.js]
# [server_webhooks_config.lua]

## 1.0.2

1. Added two different radar object types. Now stationary radars and average speed zones have distinct models. See Config.lua.
2. Added options in Config.lua to customize screen effects and sounds.
3. Added mobile speed cameras.
4. Added animations.
5. Added "snapshot".
6. Fixed minor things.
7. Check [database] folder in [item.png] folder you find mobile camera icon.
8. For mobile camera prop:
   ensure_bzzz_pdradar
   ensure intersystems_speed_cameras
#  To download mobile prop camera, please visit this link and download it [FREE] - https://bzzz.tebex.io/package/6631002

## Changes has been made in Config.lua & nofitications.lua & index.html & style.css & script.js
# [Config.lua] - Includes new settings and radar model options.
# [index.html] - Added new NUI elements for mobile cameras.
# [style.css]  - Added styles for the mobile cameras NUI.
# [script.js]  - Implemented new functions for mobile camera logic.
# [notifications.lua] - Added new translations for mobile cameras.

## 1.0.1

1. Fixed imports in some older versions of the ESX Framework.
2. Fixed incorrect display of the Place object key in index.html

## Changes has been made in index.html & Config.lua & fxmanifest.lua
# [fxmanifest.lua] - been added at 9 line: shared_script '@es_extended/imports.lua' -- Qb-core - do we need comment out this line?
# [index.html] - been changed at 384 line: <span><kbd>E</kbd> Place object</span>
# [Config.lua] - been added in 3 line: -- if qb-core please comment out the 9 line in fxmanifest.lua






