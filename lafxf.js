import cloud from '@lafjs/cloud'
import Axios from 'axios'
export async function main(ctx: FunctionContext) {
    let xffwq = cloud.env.LAF_XF_LIST
    const axios = Axios.create({
    })
    axios.interceptors.response.use(
        response => {
            return response
        },
        error => {
            if (error.code === 'ECONNABORTED' || error.message.indexOf('timeout') !== -1 || error.message === 'Network Error') {
                return Promise.reject(error)
            }
            if (error.response.status!=200){
                return retjson(error.response.status,error.response.statusText)
            }
        }
    )
    const ret = {
        "code":200,
        "msg":"ok,续费成功"
    }
    function retjson(code:number,msg:string=null){
        let codeList = {
            200:"ok,续费成功",
            201:msg,
            202:"获取authorization失败"
        }
        let ret1 = {
            "code":200,
            "msg":"ok,续费成功"
        }
        ret1.code = code
        ret1.msg = codeList[code]
        if (codeList[code]==null){
            ret1.msg = msg
        }
        return ret1
    }
    function login(username:string,password:string){
        return axios({
            url:"https://login.laf.dev/api/login?clientId=05978e65d609e83258ce6&responseType=code&redirectUri=https://laf.dev/login_callback&scope=openid,profile,phone,email&state=casdoor&nonce=&code_challenge_method=&code_challenge=",
            method:"POST",
            responseType:"json",
            data:{
                application: "laf",
                organization: "laf",
                username: username,
                password: password,
                autoSignin: true,
                type: "code",
                phonePrefix: "86",
                samlRequest: ""
            }
        })
    }
    function get_authorization(d:string){
        return axios({
            url:"https://laf.dev/v1/code2token?code=" + d,
            method:"GET",
            responseType:"json",
        })
    }
    function xf(id:string,authorization:string){
        return axios({
            url:"https://laf.dev/v1/subscriptions/" + id + "/renewal",
            method:"POST",
            responseType:"json",
            data:{
                id: id,
                duration: 2678400,
                // 2678400
            },
            headers:{
                authorization:authorization
            }
        })
    }
    let t = await login(cloud.env.LAF_XF_USERNAME,cloud.env.LAF_XF_PASSWORD)
    if (t['code'] != undefined && t['code'] != 200){
        return t
    }
    if (t.data.status != "ok"){
        return retjson(201,t.data.msg)
    }
    let d = t.data.data
    t = await get_authorization(d)
    if (t['code'] != undefined && t['code'] != 200){
        return t
    }
    if (t.data.error != null){
        return retjson(202)
    }
    let authorization = "Bearer " + t.data.data
    t = await xf(xffwq,authorization)
    if (t['code'] != undefined && t['code'] != 200){
        return t
    }
    console.log(t.data,retjson(200,t.data.error))
    return retjson(200,t.data.error)
}
