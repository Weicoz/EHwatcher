var base = require('scripts/base');
//初始化数据
var def_width = $device.info.screen.width
var def_height = $device.info.screen.width * 1.47;
var def_elist_url = 'https://e-hentai.org/?f_cats=1017&f_search=Chinese&inline_set=dm_t&page=0'
var def_list_type = 'local'

var width, height, elist_url,list_type

var scr_width = $device.info.screen.width;
var scr_height = $device.info.screen.height;

var list_type = "local";

var elistData = [];
var is_insert_db = false


init_data()
var db = new db_class("img_date.db");
var indexData = getMainimg();
/**
 * 初始化数据
 */
function init_data(){
    width = $cache.get("width")
    if (!width){
        $cache.set("width", def_width);
        width = def_width
    }
    height = $cache.get("height")
    if (!height){
        $cache.set("height", def_height);
        height = def_height
    }
    //elist_url = $cache.get("elist_url")
    if (!elist_url){
        def_elist_url = def_elist_url + '&inline_set=dm_t';
        $cache.set("elist_url",def_elist_url);
        elist_url = def_elist_url;
    }

    list_type = $cache.get("list_type")
    if (!list_type){
        $cache.set("list_type", def_list_type);
        list_type = def_list_type
    }

}



/**
 * 获取页面总数据
 * @param {*} url 
 */
function getIndexData(url, is_reload) {
    console.log("getIndexData | url:" + url);
    //获取原始链接
    url = url.replace(/\?p=[0-9]$/, "");
    if (indexData[url] && is_reload == 1) {
        delete indexData[url];
        db.deleteData(url);
        base.log_show("正在重载:" + url);
    }

    if (indexData[url]) {
        //判断是否已经完成加载
        if (indexData[url]["status"] == false) {
            base.log_show("本地重复加载");
            return false;
        }
    } else {
        //创建空对象
        indexData[url] = {"title": url,'name': '','url': url, 'item': {},'count':0, "status": true, "indexpage": 0, "images": [] };
        $ui.loading(true);
    }
    getIndexDataHttp(url,indexData[url]);
}



function get_reg_arr(type,dom){
    var reg = '';
    var result = false;
    switch (type) {
        case 'list_page_num':   //列表页底部分页数 indexpage_count
            reg = /<table class="ptb".*?<\/table>/;
            result = base.dom_reg(dom,reg)
            if (result){
                reg = /<td .*?\/td>/g;
                result = base.dom_reg(result,reg).length - 2
            }else{
                result = 2
            }
            break;
        case 'name':           //图册标题
            reg = /<h1 id="gj">.*?<\/h1>/;
            result = base.dom_reg(dom,reg)
            if (result){
                result = result.replace(/<h1 id="gj">/,'').replace(/<\/h1>/,'')
            }
            break;
        case 'page_url':        //图册url集合
            reg = /no-repeat"><a href="https:\/\/e-hentai.org\/s\/.{1,15}\/.{1,12}-\d{1,3}"><img alt=/g;
            result = base.dom_reg(dom, reg);
            break;
        case 'page_url_item':   //整理图册url
            result = dom.replace(/no-repeat"><a href="/, "").replace(/"><img alt=/, "")
            break;
        case 'page_url_num':    //整理图册url分页
            reg = /-\d{1,3}$/;
            result = base.dom_reg(dom, reg).replace(/-/, "");
        default:
            break;
    }
    return result;


}



/**
 * 页面获取http
 * @param {*} url 
 * @param {*} get_img_data 
 */
function getIndexDataHttp(url, get_img_data){
    //获取页面元素
    $http.request({
        method: "GET",
        url: url + "?p=" + get_img_data["indexpage"],
        header: {},
        body: {},
        handler: function (resp) {
            //页面dom
            var data = resp.data;
            //判断是否存在底部分页
            indexpage_count = get_reg_arr('list_page_num',data);
            base.log_show("indexpage_count：" + indexpage_count);

            //标题
            if (!get_img_data['name']) {
                get_img_data['name'] = get_reg_arr('name',data);
            }

            //图片数组
            var page_url = get_reg_arr('page_url',data)
            //组合基本图片数组
            for (var i in page_url) {
                //获取图片url
                page_url[i] = get_reg_arr('page_url_item',page_url[i]);
                //获取图片当前页数
                var page = get_reg_arr('page_url_num',page_url[i]);
                get_img_data['item'][page] = {
                    'page_url': page_url[i],
                    'page': page
                };
            }
            base.log_show("NOW PAGE " + get_img_data["indexpage"]);

            if (get_img_data['item']) {
                console.log(get_img_data);
                get_img_data["count"] = Object.keys(get_img_data['item']).length;
                if (get_img_data["indexpage"] + 1 >= indexpage_count) {
                    console.log("getImgData");
                    indexData[url] = get_img_data;
                    getImgData(indexData, url);     //数据获取完成，组合对象
                } else {
                    get_img_data["indexpage"]++;
                    indexData[url] = get_img_data;
                    getIndexData(url);              //继续获取下一页数据
                }
            } else {
                base.log_show("page_url 为空")
                return false
            }
        }
    });
}










/**
 * 加载图片列表
 */
function viewList() {
    console.log("list_type", list_type)
    if (list_type == 'local') {
        list_data = function () {
            return getIndexImg();
        }
    } else {
        list_data = function () {
            return getElist(elist_url, 1);
        };
    }
    $ui.render({
        props: {
            id: 'viewList',
            title: "viewList"
        },
        views: [{
            id: "matrix",
            type: "matrix",
            props: {
                columns: 3,         //列数
                itemHeight: 200,    //每个元素高度
                spacing: 1,
                selectable: true,
                template: {         //模板
                    props: {
                        bgcolor: $color("clear")
                    },
                    views: [{
                        type: "image",
                        props: {},
                        layout: $layout.fill,
                    }]
                },
                data: list_data(),    //数据
                actions: [{     //操作
                    title: "delete",
                    color: $color("gray"), // default to gray
                    handler: function (sender, indexPath) { }
                }]
            },
            layout: $layout.fill,
            events: {
                didSelect: function (sender, indexPath, data) {
                    console.log("list_type", list_type);
                    if (list_type == "local") {
                        typeList(data.image.title)
                    } else {
                        $ui.menu({
                            items: ["加载到本地"],
                            handler: function (title, idx) {
                                switch (title) {
                                    case '加载到本地':
                                        loadImg(data.image.url);
                                        break;
                                }
                            }
                        });
                    }
                },
                pulled(sender) {
                    $("matrix").data = change_list(false)
                    $("matrix").endRefreshing()
                },
                didLongPress: function (sender, indexPath, data) {
                    pressMenu(data) //长按操作
                },
            },
        }, load_button(), change_button(),
        ]
    })
}


/**
 * 加载按钮
 */
function load_button() {
    return {
        type: "button",
        props: {
            title: "加载"
        },
        layout: function (make, view) {
            make.centerX.equalTo(view.super)
            make.bottom.inset(30)
            make.size.equalTo($size(70, 35))
        },
        events: {
            tapped: function (sender) {
                loadImg();      //加载图片
            },
            longPressed: function (sender) {
                option_main();   //更改图片大小
            },
        }
    }
}


/**
 * 更换按钮
 */
function change_button() {
    return {
        type: "button",
        props: {
            title: "<->"
        },
        layout: function (make, view) {
            make.right.inset(50)
            make.bottom.inset(30)
            make.size.equalTo($size(35, 35))
        },
        events: {
            tapped: function (sender) {
                change_list(true);
            },
            longPressed: function (sender) {
                $ui.menu({
                    items: ["上一页", "下一页", "加载"],
                    handler: function (title, idx) {
                        switch (title) {
                            case "加载":
                                $input.text({
                                    type: $kbType.search,
                                    placeholder: "Input a Url",
                                    handler: function (text) {
                                        elist_url = text
                                        $cache.set("elist_url", elist_url);
                                        change_list("internet")
                                    }
                                });
                                break;
                            case "上一页":
                                var prev_url = elist_url_info(elist_url)['prev_url'];
                                getElist(prev_url)
                                break;
                            case "下一页":
                                next_url = elist_url_info(elist_url)['next_url'];
                                getElist(next_url)
                                break;
                        }
                    }
                });


            },
        }
    }
}


function change_list(change) {
    if (change) {
        if (list_type == "local" || change == "internet") {
            list_type = "internet";
            $("matrix").data = getElist();
        } else if (list_type == "internet" || change == "local") {
            list_type = "local";
            $("matrix").data = getIndexImg();
        }
    } else {
        if (list_type == "local") {
            $("matrix").data = getIndexImg();
        } else {
            $("matrix").data = getElist();
        }
    }
    $('matrix').title = list_type;
    $cache.set("list_type", list_type);
    console.log(list_type);
    $("matrix").endRefreshing()
}


/**
 * 长按操作
 * @param {*} data 
 */
function pressMenu(data) {
    $ui.menu({
        items: ["重载", "删除", "复制"],
        handler: function (title, idx) {
            if (title == "删除") {
                $ui.alert({
                    title: "确认要删除吗？",
                    actions: [{
                        title: "OK",
                        handler: function () {
                            delete indexData[data.image.title];
                            $cache.set("indexData", indexData);
                            db.deleteData(data.image.title)
                            $("matrix").data = getIndexImg()
                        }
                    }, {
                        title: "Cancel",
                        handler: function () { }
                    }]
                })
            } else if (title == "重载") {
                getIndexData(data.image.title, 1)
            } else if (title == "复制") {
                $clipboard.text = data.image.title
                base.log_show(data.image.title)
            }
        },
        finished: function (cancelled) {
        }
    })
}



/**
 * 双击操作
 * @param {*} data 
 */
function doublePressMenu(data) {
    $ui.menu({
        items: ["压缩"],
        handler: function (title, idx) {
            if (title == "压缩") {
                $ui.alert({
                    title: "确认要压缩文件吗？",
                    actions: [{
                        title: "OK",
                        handler: function () {
                            var file_list = $file.list("/pic/");
                            console.log(file_list)
                            for (var i in file_list) {
                                //排除zip文件
                                if (file_list[i].indexOf(".zip") != -1) {
                                    base.log_show('跳过zip文件 ' + file_list[i]);
                                    continue;
                                    
                                }
                                var file_zip = $file.exists("/pic/" + file_list[i] + ".zip");
                                if (!file_zip) {
                                    var path_zip = "/pic/" + file_list[i] + ".zip";
                                    var path = "/pic/" + file_list[i];
                                    base.archiver(path, path_zip);
                                }
                            }
                        }
                    }, {
                        title: "Cancel",
                        handler: function () { }
                    }]
                })
            }
        },
        finished: function (cancelled) {
        }
    })
}

/**
 * 转换url
 * @param {*} url 
 */
function elist_url_info(url) {
    data = {};
    page = base.dom_reg(url, /page={1,6}[0-9]/)
    if (page){
        page = page.replace(/page=/, "");
    }else{
        url += "&page=0";
        page = 0;
    }
    if (parseInt(page) == 0) {
        prev_page = "0";
    } else {
        prev_page = parseInt(page) - 1;
    }
    next_page = parseInt(page) + 1;
    data["url"] = url;
    data["page"] = page;
    data["prev_page"] = prev_page;
    data["next_page"] = next_page;
    data["prev_url"] = url.replace("page=" + page, 'page=' + prev_page);
    data["next_url"] = url.replace("page=" + page, 'page=' + next_page);
    return data
}


/**
 * 页面读取
 */
function getElist(url, is_reload) {
    if ((typeof (url) == "undefined" || url == elist_url) && elistData.length != 0 && !is_reload) {
        $ui.loading(false);
        $("matrix").data = elistData;
        return;
    }
    if (url && typeof (url) != "undefined") {
        elist_url = url;
    }
    console.log("getElist", elist_url)
    $ui.loading(true);
    $http.get({
        url: elist_url,
        handler: function (resp) {
            var data = resp.data
            var elist = base.dom_reg(data, /<div class="gl3t" .*?<a href=".*?<\/a>/g);
            elistData = [];
            for (var i in elist) {
                elist[i] = elist[i].replace(/<div class="gl3t" .*?<a href="/, "");
                url = elist[i].replace(/"><img .*/, "");
                title = elist[i].replace(/.*?title="/, "").replace(/".*/, "");
                src = elist[i].replace(/.*?src="/, "").replace(/".*/, "");
                var imgObj = {
                    image: {
                        title: title,
                        src: src,
                        url: url,
                    }
                }
                elistData.push(imgObj);
            }
            $("matrix").data = elistData
            $ui.loading(false);
        }
    });
}


/**
 * 获取封面图片
 */
function getIndexImg() {
    var indexImg = [];
    indexData = getMainimg()
    for (var i in indexData) {
        var imgObj = {
            image: {
                title: i,
                src: indexData[i]["main_url"]
            }
        }
        indexImg.push(imgObj);
    }
    return indexImg;
}

/**
 * 获取图片对象链接
 * @param html_data 网站源代码
 */
function getImgObj(html_data) {
    var img_url = base.dom_reg(html_data, '<img id="img" src=".*? style=')
    if (img_url) {
        img_url = img_url.replace(/<img id="img" src="/, "").replace(/" style=/, '');
    } else {
        img_url = false;
    }
    return img_url;
}


var complet_count = 0;
var imgObjs = {}

/**
 * 组合图片对象
 * @param {*} indexData 
 * @param {*} url 
 */
function getImgData(indexData, url) {
    complet_count = 0;
    imgObjs = {}
    for (var i in indexData[url]['item']) {
        setimages(i, url)
    }
}


function setimages(page_i, url) {
    $http.get({
        url: indexData[url]['item'][page_i]['page_url'],
        handler: function (resp) {
            var data = resp.data;
            var link = getImgObj(data);
            // console.log(link);
            if (link) {
                //文件名
                var img_name = base.dom_reg(link, '[0-9]{1,3}\.(jpg|png|gif)$');
                indexData[url]['item'][page_i]['img_name'] = img_name;
                //图片链接
                indexData[url]['item'][page_i]['img_url'] = link;

                //组合数组
                if (!indexData[url]['imgObj']) {
                    indexData[url]['imgObj'] = {}
                }
                indexData[url]['imgObj'][page_i] = {
                    type: "image",
                    props: {
                        src: link
                    }
                }
            }
            complet_count++;
            base.log_show(complet_count + " | " + indexData[url]['count'])
            //完成触发
            if (complet_count >= indexData[url]['count']) {
                //设置封面
                if (indexData[url]['item'][1]['img_url']) {
                    indexData[url]['main_url'] = indexData[url]['item'][1]['img_url'];
                }
                indexData[url]['status'] = false;
                $cache.set("indexData", indexData);

                //下载文件
                if ($cache.get("download_switch")) {
                    download_type(url,indexData[url]['name']);
                }


                //添加主数据
                // for (var i in imgObjs) {
                //     var imgListdata = {
                //         "site": "e-hentai",
                //         "title": url,
                //         "url": url,
                //         "mainurl": imgObjs[i]["props"]["src"],
                //         "pagesize": indexData[url]["count"],
                //         "isvalid": 1,
                //         "createtime": base.daytime(),
                //     }
                //     if (is_insert_db == true){
                //         db.insertList(imgListdata);
                //     }
                //     break;
                // }

                //详情数据
                // for (var i in imgObjs) {
                //     indexData[url]["images"].push(imgObjs[i]);
                //     var imgListDetaildata = {
                //         "list_id" : "",
                //         "site" : "e-hentai",
                //         "title" : url,
                //         "url" : url,
                //         "imgurl" : imgObjs[i]["props"]["src"],
                //         "page" : parseInt(i) + 1,
                //         "isvalid" : 1,
                //         "createtime" : base.daytime(),
                //     }
                //     if (is_insert_db == true){
                //         db.insertListDetail(imgListDetaildata);
                //     }
                //     //计算页码
                //     var pages = i;
                //     pages = pages.toString();
                //     if (pages.length < 3){
                //         pages = "0" + pages.toString();
                //         if (pages.length < 3){
                //             pages = "0" + pages.toString();
                //         }
                //     }
                //     //下载到本地
                //     //
                // }


                $ui.loading(false);
                if (list_type == "local") {
                    change_list(false)
                }
                console.log({ indexData: indexData });
            }
        }
    })
}


function download_type(url, title) {
    //建立文件目录
    // var path = "/pic/" + url.replace(/https:\/\/e-hentai.org\/g\//, "").replace(/\//, "");
    var path = "/pic/" + title;
    if (!$file.exists(path)) {
        var success = $file.mkdir(path)
    } else {
        //存在则退出
        $ui.loading(false);
        $("matrix").data = getIndexImg()
        base.log_show("已存在跳过" + title)
        return;
    }
    for (var i in indexData[url]['item']) {
        base.download_file(indexData[url]['item'][i]['img_url'], path + "/" + indexData[url]['item'][i]['img_name']);
    }
}



/**
 * 显示图片
 * @param {*} title 
 * @param {*} imgList 
 */
function typeList(title) {
    var type_list = $cache.get("type_list");
    if (!type_list) {
        type_list = 'gallery';
        $cache.set("type_list", type_list);
    }
    if (type_list == "gallery") {
        galleryList(title);
    } else if (type_list == "list") {
        imagesList(title);
    }
}


/**
 * 加载图片
 * @param title
 * @param imgList
 */
function galleryList(title) {
    $ui.push({
        props: {
            "title": title
        },
        views: [{
            type: "gallery",
            props: {
                items: getDetailimg(title),
            },
            layout: function (make, view) {
                make.top.inset(0);
                make.centerX.equalTo(view.super)
                make.width.equalTo(width);
                make.height.equalTo(height);
            },
        }, load_button()]
    })
}


/**
 * 加载图片
 * @param title
 * @param imgList
 */
function imagesList(title) {
    $ui.push({
        props: {
            "title": "imgList",
        },
        views: [{
            type: "list",
            props: {
                data: getDetailimg(title),
                rowHeight: height,
            },
            layout: function (make, view) {
                make.top.inset(0);
                make.centerX.equalTo(view.super)
                make.width.equalTo(width);
                make.height.equalTo(scr_height);
            },
        }, load_button(),]
    })
}

/**
 * 加载图片
 */
function loadImg(url) {
    if (url) {
        getIndexData(url)
    } else if ($clipboard.link) {
        getIndexData($clipboard.link)
    } else {
        $input.text({
            type: $kbType.search,
            placeholder: "Input a Url",
            handler: function (text) {
                getIndexData(text)
            }
        });
    }
}


/**
 * 设置
 */
function option_main() {
    var download_switch = $cache.get("download_switch");
    if (!download_switch) {
        var download_switch_ch = '关';
    } else {
        var download_switch_ch = '开';
    }
    $ui.menu({
        items: ["Width", "Height", '列表方式', '下载：' + download_switch_ch, '压缩',"清空"],
        handler: function (title, idx) {
            //设置图片宽度
            switch (title) {
                case "Width":
                    $input.text({
                        type: $kbType.search,
                        placeholder: "Max " + scr_width + " | Width: " + width,
                        handler: function (text) {
                            width = parseInt(text);
                        }
                    });
                    break;
                case "Height":
                    $input.text({
                        type: $kbType.search,
                        placeholder: "Max " + scr_height + " | Height: " + height,
                        handler: function (text) {
                            height = parseInt(text);
                        }
                    });
                    break;
                case "压缩":
                    doublePressMenu();
                    break;
                case "列表方式":
                    $ui.menu({
                        items: ["Gallery", "List"],
                        handler: function (title, idx) {
                            switch (title) {
                                case "Gallery":
                                    $cache.set("type_list", "gallery");
                                    break;
                                case "List":
                                    $cache.set("type_list", "list");
                                    break;
                            }
                        }
                    });
                    break;
                case "下载：关":
                    $cache.set("download_switch", true);
                    break;
                case "下载：开":
                    $cache.set("download_switch", false);
                    break;
                case "清空":
                    indexData = [];
            }

        },
        finished: function (cancelled) {

        }
    })
}







/**
 * db类class
 */
function db_class(db_name) {
    var db = $sqlite.open(db_name);
    this.close = function () {
        db.close();
    }
    /**
     * 创建表数据
     */
    this.createTable = function () {

        var sql = "CREATE TABLE image_list(" +
            "id INTEGER PRIMARY KEY NOT NULL," +
            "site char(11) NOT NULL," +
            "title char(500) NOT NULL," +
            "url char(500) NOT NULL," +
            "mainurl char(500) NOT NULL," +
            "pagesize int(11) NOT NULL," +
            "isvalid bit(1) NOT NULL," +
            "createtime datetime NOT NULL)";
        db.update(sql);


        var sql = "CREATE TABLE image_list_detail(" +
            "id INTEGER PRIMARY KEY NOT NULL," +
            "list_id int(11) NOT NULL," +
            "site char(11) NOT NULL," +
            "title char(500) NOT NULL," +
            "url char(500) NOT NULL," +
            "imgurl char(500) NOT NULL," +
            "page int(11) NOT NULL," +
            "isvalid bit(1) NOT NULL," +
            "createtime datetime NOT NULL)";
        db.update(sql);
    }

    /**
     * 删除表数据
     */
    this.dropTable = function () {
        var sql = "DROP TABLE image_list_detail;";
        db.update(sql);
        var sql = "DROP TABLE image_list;";
        db.update(sql);
    }


    /**
     * 查询数据
     * @param {*} table 表名
     * @param {*} where 条件
     */
    this.select = function (table, where) {
        var sql = "SELECT * FROM " + table + " WHERE " + where;
        var obj = db.query(sql);
        //console.warn(obj.result);
        return obj.result;
    }



    /**
     * 插入数据
     */
    this.insertList = function (data) {
        var sql = "INSERT INTO image_list (id,site,title,url,mainurl,pagesize,isvalid,createtime) VALUES (NULL,'" + data["site"] + "','" + data["title"] + "','" + data["url"] + "','" + data["mainurl"] + "','" + data["pagesize"] + "','" + data["isvalid"] + "','" + data["createtime"] + "');";
        //console.log(sql);
        db.update(sql);
    }

    /**
     * 插入数据详情
     * @param {*} data 
     */
    this.insertListDetail = function (data) {
        var sql = "INSERT INTO image_list_detail (id,list_id,site,title,url,imgurl,page,isvalid,createtime) VALUES (NULL,'" + data["list_id"] + "','" + data["site"] + "','" + data["title"] + "','" + data["url"] + "','" + data["imgurl"] + "','" + data["page"] + "','" + data["isvalid"] + "','" + data["createtime"] + "');"
        //console.log(sql);
        db.update(sql);
    }


    /**
     * 删除对应数据
     * @param {*} url 
     */
    this.deleteData = function (url) {
        var sql = "DELETE FROM image_list WHERE url='" + url + "';";
        var obj = db.update(sql);

        var sql = "DELETE FROM image_list_detail WHERE url='" + url + "';";
        var obj = db.update(sql);
    }

}






/**
 * 查询首页数据
 */
function getMainimg() {
    // var img_data = {};
    // var list_data = db.select("image_list","id > 0");
    // if (list_data){
    //     while (list_data.next()) {
    //         var list_value = list_data.values;
    //         img_data[list_value["url"]] = list_value;
    //         img_data[list_value["url"]]["status"] = false;
    //     }
    // }
    //console.log({"getMainimg":img_data});
    if (!$cache.get("indexData")) {
        return {};
    } else {
        return $cache.get("indexData");
    }

}


/**
 * 组合图片输出数据
 * @param {*} url 
 */
function getDetailimg(url) {
    var img_detail = [];
    for (var i in indexData[url]['item']) {
        var detail_img = {
            type: "image",
            props: {
                src: indexData[url]['item'][i]['img_url']
            },
            layout: function (make, view) {
                make.center.equalTo(view.super);
                make.size.equalTo($size(width, height))
            }
        }
        img_detail.push(detail_img);
    }


    // while (list_detail.next()) {
    //     var list_value = list_detail.values;
    //     if (type_list == "gallery"){
    //         var detail_img = {
    //             type: "image",
    //             props: {
    //                 src: list_value.imgurl
    //             }
    //         }
    //     }else{
    //         var detail_img = {
    //             type: "image",
    //             props: {
    //                 src: list_value.imgurl
    //             },
    //             layout: function (make, view) {
    //                 make.center.equalTo(view.super);
    //                 make.size.equalTo($size(width, height))
    //             }
    //         }
    //     }
    //     img_detail.push(detail_img);
    // }
    //console.log({"getDetailimg":img_detail});
    return img_detail;
}


// openDb();
//db.dropTable();
//db.createTable();
//getMainimg();


module.exports = {
    getIndexData: getIndexData,
    viewList: viewList,
    getElist: getElist,
}
