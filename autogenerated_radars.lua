-- Automatically generated stationary camera's file.

--
-- Camera: Your speed camera (Created: Fri Dec 12 12:25:03 2025)
table.insert(Config.Radars, {
    name = 'Your speed camera',
    coords = vector3(-1353.4128, -2472.8162, 13.9451),
    limit = 50,
    penalties = {
            { from = 10, to = 19, points = 1, fine = 50 },
            { from = 20, to = 29, points = 2, fine = 120 },
            { from = 30, to = 999, points = 3, fine = 250 },
    }
})
