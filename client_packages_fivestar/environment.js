var updateGameTime = true;

var nowTime = { Hour: 0, Minute: 0 };
var nowDate = { Day: 7, Month: 4, Year: 2018 };
var nowWeather = "EXTRASUNNY";

mp.events.add('Enviroment_Time', (data) => {
    if (data == undefined) return;
    if (updateGameTime)
        mp.game.time.setClockTime(data[0], data[1], 0);

    //var newTime = { Hour: data[0], Minute: data[1] };
    nowTime.Hour = data[0];
    nowTime.Minute = data[1];

    let time = `${two(nowTime.Hour)}:${two(nowTime.Minute)}`;
    mp.gui.execute(`HUD.time='${time}'; chat.stime = '${time}'`);
})

mp.events.add('Enviroment_Date', (data) => {
    if (data == undefined) return;
    //var newTime = { Hour: data[0], Minute: data[1] };
    nowDate.Day = data[0];
    nowDate.Month = data[1];
    nowDate.Year = data[2];

    let date = `${two(nowDate.Day)}.${two(nowDate.Month)}.${nowDate.Year}`;
    mp.gui.execute(`HUD.date='${date}'`);
})

mp.events.add('Enviroment_Weather', (weather) => {
    if (updateGameTime)
        mp.game.gameplay.setWeatherTypeNow(nowWeather, weather, 0.5);
    nowWeather = weather;
})

mp.events.add('Enviroment_Start', (timeData, dateData, weather) => {
    mp.game.time.setClockTime(timeData[0], timeData[1], 0);
    
    nowTime.Hour = timeData[0];
    nowTime.Minute = timeData[1];

    let time = `${two(nowTime.Hour)}:${two(nowTime.Minute)}`;
    mp.gui.execute(`HUD.time='${time}'`);

    nowDate.Day = dateData[0];
    nowDate.Month = dateData[1];
    nowDate.Year = dateData[2];

    let date = `${two(nowDate.Day)}.${two(nowDate.Month)}.${nowDate.Year}`;
    mp.gui.execute(`HUD.date='${date}'`);

    mp.game.gameplay.setWeatherTypeNow(nowWeather, weather, 0.5);
    nowWeather = weather;

    mp.events.call('authready');
})

setInterval(() => {
    if (updateGameTime) {
        mp.game.gameplay.setWeatherTypeNow(nowWeather);
    }
}, 1000);

mp.events.add('stopTime', () => {
    updateGameTime = false;

    mp.game.gameplay.setWeatherTypeNow('EXTRASUNNY');
    mp.game.time.setClockTime(0, 0, 0);
})
mp.events.add('resumeTime', () => {
    updateGameTime = true;

    mp.game.gameplay.setWeatherTypeNow(nowWeather);
    mp.game.time.setClockTime(nowTime.Hour, nowTime.Minute, 0);
})

function two(num) { return ("0" + num).slice(-2); }