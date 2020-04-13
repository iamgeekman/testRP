var HUD = new Vue({
    el: ".grade",
    data: {
        show: false,
        ammo: 0,
        money: 0,
        bank: 0,
        mic: false,
        time: "00:00",
        date: "00.00.00",
        /* VEHICLE */
        inVeh: false,
        engine: false,
        doors: false,
        speed: 0,
        cruiseColor: '#ffffff', // cruise mode color ('#ffffff' = off, '#eebe00' = on)
        ifuel: 0, // Fuel Info (0 - Red, 1 - Yellow, 2 - Green)
        fuel: 0,
        hp: 0,
    },
    methods: {
        setTime: (time, date) => {
            this.time = time;
            this.date = date;
        }
    }
})

var WaterMark = new Vue({
    el: ".logobox",
    data: {
        show: false,
        online: 0,
    }
})