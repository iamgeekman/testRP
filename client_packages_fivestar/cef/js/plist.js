var plist = new Vue({
    el: ".plist",
    data: {
        active: false,
        online: 0,
        items: []
    },
    methods: {
        reset: function () {
            this.items = [];
            this.online = 0;
        },
        show: function () {
            this.reset();
            this.active = true;
        },
        hide: function () {
            this.reset();
            this.active = false;
        },
        add: function (id, nick, lvl, ping) {
            this.items.push([id, nick, lvl, ping]);
            this.online++;
        }
    }
})