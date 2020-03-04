function sayHello() {
    $ui.alert($l10n('HELLO_WORLD'));
}

function startserver() {
    $http.startServer({
        port: 6868,
        path: "",
        handler: function (result) {
            var url = result.url
            $clipboard.set({
                "type": "public.plain-text",
                "value": url
            })
        }
    })
}

function get_localtion() {
    $location.fetch({
        handler: function (resp) {
            var result = []
            result["lat"] = resp.lat
            result["lng"] = resp.lat
            result["alt"] = resp.alt
            console.log(result)
            return result
        }
    })
}


function daytime(time) {
    if (time){
        var myDate = new Date(time)
    }else{
        var myDate = new Date()
    }
    var settime = myDate.getFullYear() + "-" +
        (myDate.getMonth() + 1) + "-" +
        myDate.getDate() + " " +
        myDate.getHours() + ":" +
        myDate.getMinutes() + ":" +
        myDate.getSeconds();
    return settime
}


/**
 * 日志同时记录
 * @param {*} content 
 */
function log_show(content){
    console.warn(content)
    $ui.toast(content)
    //log_insert(content)
}

/**
 * 正则获取第一条数据
 * @param {*} dom 
 * @param {*} reg 
 * @param {*} type 
 */
function dom_reg(dom, reg, type = '') {
    match_data = dom.match(reg)
    if (match_data) {
        if (!reg.toString().match(/\/g$/) && type != 'all'){
            match_data = match_data[0]
        }
        return match_data
    } else {
        log_show("dom_reg|false|"+reg+"|"+dom)
        return false
    }
}

function download_file(url,path,func){
    $http.download({
        url: url,
        showsProgress: true, // Optional, default is true
        progress: function(bytesWritten, totalBytes) {
          var percentage = bytesWritten * 1.0 / totalBytes
        },
        handler: function(resp) {
          var success = $file.write({
            data: resp.data,
            path: path
          });
          if (func){
            eval(func);
          }
        }
    })
}

/**
 * 文件压缩
 * @param {*} path 
 * @param {*} name 
 */
function archiver(path,name) {
    log_show("开始压缩");
    $archiver.zip({
        directory: path,
        dest: name,
        handler: function (success) {
            log_show("压缩成功 " + name);
        }
    })
}


function log_insert(log_content){
    var myDate = new Date()
    var log_date = myDate.getFullYear() + (myDate.getMonth() + 1) + myDate.getDate()

    if (!$file.exists("/log")){
        $file.mkdir('log')
    }
    log_content = daytime() + ' | ' + log_content + "\n"
    var success = $file.write({
        data: $data({string: log_content}),
        path: log_date + '.log'
    })
    return success
}


module.exports = {
    log_show: log_show,
    dom_reg: dom_reg,
    startserver: startserver,
    get_localtion: get_localtion,
    daytime:daytime,
    download_file:download_file,
    archiver:archiver
}
