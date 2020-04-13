var circleDesc = {
    "handshake": "Пожать руку",
    "licenses": "Показать лицензии",
    "carinv":"Инвентарь",
    "doors":"Открыть/Закрыть двери",
    "fraction":"Фракция",
    "offer":"Предложить обмен",
    "givemoney":"Передать деньги",
    "heal":"Вылечить",
    "hood":"Открыть/Закрыть капот",
    "leadaway":"Вести за собой",
    "offerheal":"Предложить лечение",
    "passport":"Показать паспорт",
    "search":"Обыскать",
    "sellkit":"Продать аптечку",
    "takegun":"Изъять оружие",
    "takeillegal":"Изъять нелегал",
    "trunk":"Открыть/Закрыть багажник",
    "pocket": "Надеть/снять мешок",
    "takemask": "Сорвать маску",
    "rob": "Ограбить",
    "house": "Дом",
    "ticket": "Выписать штраф",

    "sellcar": "Продать машину",
    "sellhouse": "Продать дом",
    "roommate": "Заселить в дом",
    "invitehouse": "Пригласить в дом",

    "furninv": "Открыть инвентарь",
    "furnlock": "Открыть/Закрыть",
    "furnmove": "Переставить",
    "furnremove": "Убрать",

    "acancel": "Остановить анимацию",

    "acat1": "Сесть/Лечь",
    "acat2": "Социальные",
    "acat3": "Физ. упражнения",
    "acat4": "Неприличное",
    "acat5": "Стойка",
    "acat6": "Танцы",

    "anext": "След. страница",

    "seat1": "Сидеть полулёжа",
    "seat2": "Сидеть на корточки",
    "seat3": "Сидеть на землю",
    "seat4": "Лечь на землю",
    "seat5": "Валяться на земле",
    "seat6": "Сидеть на колено",
    "seat7": "Сидеть расслабленно",
    "seat8": "Сидеть на лестницу",

    "social1": "Поднять руки",
    "social2": "Осмотреть и записать",
    "social3": "Лайк",
    "social4": "Воинское приветствие",
    "social5": "Испуг",
    "social6": "Сдаться",
    "social7": "Показать мускулы",
    "social8": "Поднять руки",

    "phis1": "Зарядка 1",
    "phis2": "Зарядка 2",
    "phis3": "Качать пресс",
    "phis4": "Флексить мускулами",
    "phis5": "Флексить мускулами 2",
    "phis6": "Флексить мускулами 3",

    "indecent1": "Показать средний палец",
    "indecent2": "Показать что-то ещё",

    "stay1": "Стоять, руки на поясе",
    "stay2": "Размять руки",
    "stay3": "Сложить руки",
    "stay4": "Опереться на что-то",

    "dance1": "Танец 1",
    "dance2": "Танец 2",
    "dance3": "Танец 3",
    "dance4": "Танец 4",
    "dance5": "Танец 5",
    "dance6": "Танец 6",
    "dance7": "Танец 7",
    "dance8": "Танец 8",
    "dance9": "Танец 9",
    "dance10": "Танец 10",
    "dance11": "Танец 11",
    "dance12": "Танец 12",
    "dance13": "Танец 13",
    "dance14": "Танец 14",
    "dance15": "Танец 15",
}
var circleData = {
    "Игрок":
    [
        ["givemoney", "offer", "fraction", "passport", "licenses", "heal", "house", "handshake"],
    ],
    "Машина":
    [
        ["hood", "trunk", "doors", "carinv"],
    ],
    "Дом":
    [
        ["sellcar", "sellhouse", "roommate", "invitehouse"],
    ],
    "Мебель":
    [
        ["furninv", "furnlock", "furnmove", "furnremove"],
    ],
    "Фракция":
    [
        [],
        ["rob"],
        ["rob"],
        ["rob"],
        ["rob"],
        ["rob"],
        ["leadaway"],
        ["leadaway", "search", "takegun", "takeillegal", "takemask", "ticket"],
        ["sellkit", "offerheal"],
        ["leadaway", "search", "takegun", "takeillegal", "takemask"],
        ["leadaway", "pocket", "rob"],
        ["leadaway", "pocket", "rob"],
        ["leadaway", "pocket", "rob"],
        ["leadaway", "pocket", "rob"],
        ["leadaway"],
    ],
    "Категории":
    [
        ["acat1", "acat2", "acat3", "acat4", "acat5", "acat6", null, "acancel"],
    ],
    "Анимации 1":
    [
        ["seat1", "seat2", "seat3", "seat4", "seat5", "seat6", "seat7", "anext"],
        ["social1", "social2", "social3", "social4", "social5", "social6", "social7", "anext"],
        ["phis1", "phis2", "phis3", "phis4", "phis5", "phis6", "phis7"],
        ["indecent1", "indecent2"],
        ["stay1", "stay2", "stay3", "stay4"],
        ["dance1", "dance2", "dance3", "dance4", "dance5", "dance6", "dance7", "anext"],
        [],
    ],
    "Анимации 2":
    [
        ["seat8"],
        ["social8", "social9", "social10"],
        [],
        [],
        [],
        ["dance8", "dance9", "dance10", "dance11", "dance12", "dance13", "dance14", "dance15"],
        [],
    ],
}

var circle = new Vue({
    el: '.circle',
    data: {
        active: false,
        icons: [null,null,null,null,null,null,null,null],
        description: null,
        title: "title",
    },
    methods:{
        set: function(t,id){
            this.icons = circleData[t][id]
            this.description = t
            this.title = t
        },
        over: function(e){
            let id = e.target.id
            if(id == 8){
                this.description = "Закрыть"
                return;
            }
            let iname = this.icons[id]
            //console.log(id, iname)
            if(iname == null){
                this.description = this.title
                return;
            }
            this.description = circleDesc[iname]
        },
        out: function(e){
            this.description = this.title
            //console.log('out')
        },
        btn: function(e){
            let id = e.target.id
            if(id == 8){
                mp.trigger("circleCallback", -1);
                this.hide();
                return;
            }
            mp.trigger("circleCallback", Number(e.target.id));
            this.hide();
        },
        show: function(t,id){
            this.active=true
            this.set(t,id)
            setTimeout(()=>{move('.circle').set('width', '480px').set('height', '480px').set('opacity', 1).end()}, 50);
        },
        hide: function(){
            //move('.circle').set('width', '80px').set('height', '80px').set('opacity', 0).end(()=>{circle.active=false})
            circle.active = false;
        }
    }
})