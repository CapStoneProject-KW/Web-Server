// database.js에서 exports 한 pool 모듈을 가져옴. ("" 써야함-> 왜? '' 랑 차이점은 뭔데?)
const { pool } = require("../../config/database");
const { response, errResponse } = require("../../config/response");
const baseResponse = require("../../config/baseResponseDict");
const logger = require("loglevel");
const indexDao = require("../DAO");
const fs = require("fs");
const ytdl = require("ytdl-core");
const request = require("request");
const path = require("path");
const multer = require("multer");
const { spawn } = require("child_process");
const axios = require('axios');
const uuid = require('uuid');
const Path = require('../../userLog/path')

// https://www.youtube.com/watch?v=PWXFsmkwuas

let flag = false

exports.accessMainPage = async function(req,res){

  /** 사용자 최초 접속시 uuid 부여 **/
  const userUUID = uuid.v4();
  // TODO : 맥북에서는 Path 설정 시 '/' 해도 되는데, 윈도우 환경이나 다른 환경에는 '\\' 해야하는 걸로 알고 있는데.....
  let path = `${Path}/${userUUID}`
  console.log("사용자 접속 :" + userUUID);
  console.log(path)


  /** 해당 uuid를 cookie에 저장 **/
  res.cookie('uuid',userUUID);

  /** 부여된 uuid를 기반으로 개인식별 폴더 생성 **/
  if(!fs.existsSync(path)){
    fs.mkdirSync(path);
  }

  return res.send(response(baseResponse.SUCCESS("접속에 성공했습니다."),userUUID));


}

exports.youtubeVideo = async function (req, res) {

  const url = req.body.url;
  console.log(url);


  /** 부여된 uuid를 쿠키에서 가져옴 **/
  const userUUID = req.cookies.uuid;
  console.log(userUUID);


  /** 영상 파일의 최종 위치, 해당 위치를 인자로 넘겨주어 접근하면 됨 **/
  /**  **/
  let path = `${Path}/${userUUID}/${userUUID}`+'youtube.mp4';
  console.log(path);

  try {

    /** 입력받은 url을 통해 비동기로 다운로드

     *  1080p = 약 15초 이하
     *  360p(default) = 약 1초 이하
     *  lowestvideo = open 불가 (별도 코덱 필요)

     **/

    /*
        /!**  혹여나 기본값으로 쓸 경우 ====> 기본 값(default) == 640 * 360  **!/
        ytdl(url)
            .pipe(fs.createWriteStream(path))
    */

    /** {quality Option = 'highestvideo' or 'lowestvideo' } **/

    ytdl(url, { quality: 'highestvideo' })
        .on('end', async () => {

          console.log('end')
          flag = true;
          /** == 비동기로 비디오를 AI서버로 보낸다면, 여기 API는 res.send로 이미 return 한 상황 ==
           * 비디오를 다운완료하면 바로 AI서버로 보내도 상관없나? 후에 있을 영상처리과정에서는 return을 어디에 해주지?
           *
           1) /index/video API에서는 마지막에 res.render로 다음화면 처리
           * **/

          /** AI모델에 영상파일 경로 전달 후 처리 => 그동안 서버는 응답을 위해 대기 **/
          let aiReturnResponse = await axios.post("http://127.0.0.1:5000/detect_video",{
                    "user_or_answer": "answer",
                    "mode": "detection",
                    "data_path": path,
                    "ckpt_path": "./pretrained/yolov7.pt"
              }).then((result)=>{

                console.log(res.data);

                axios.post("http://127.0.0.1:5000/tracking",{
                    "user_or_answer": "answer",
                    "mode": "tracking",
                    "data_path": path,
                    "ckpt_path": "./pretrained/yolov7.pt"
                }).then(result =>{
                    console.log("원본 영상 Tracking 완료")
                })

              })
        })
        .on('error', err => {
          console.log(err)
        }).pipe(fs.createWriteStream(path))

    return res.send(response(baseResponse.SUCCESS("완료되었습니다.")));

  } catch (err) {
    logger.warn("응답 실패" + err);
    return res.send(errResponse(baseResponse.FAIL));
  }
};

exports.receiveUserVideo = async (req, res) => {
    try {
        /*//
        // const mp4Path = `uploads/${Date.now()}.mp4`;
        // const tempPath =
        //     "C:/Users/user/Desktop/Programming/Last Dance/Web-Server/uploads/1674012392009.mp4";
*/
        const userUUID = req.cookies.uuid;
        const path = `${Path}/${userUUID}/${userUUID}userVideo.mp4`;
        console.log(path);
        /*videoPath: {
            "user_or_answer": "user",
                "mode": "detection",
                "data_path": path,
                "ckpt_path": "./pretrained/yolov7.pt"
        }*/
        axios
            .post(
                "http://127.0.0.1:5000/detect_video",
                {
                        "user_or_answer": "user",
                        "mode": "tracking",
                        "data_path": path,
                        "ckpt_path": "./pretrained/yolov7.pt"

                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            )
            .then((res) => {
                console.log(res.data);

                axios.post("http://127.0.0.1:5000/tracking",{
                    "user_or_answer": "user",
                    "mode": "tracking",
                    "data_path": path,
                    "ckpt_path": "./pretrained/yolov7.pt"
                }).then(result =>{
                    console.log(result);
                    console.log("사용자 영상 Tracking 완료")
                })


            });

        return res.send(response(baseResponse.SUCCESS("완료되었습니다.")));
    } catch (err) {
        logger.warn("응답 실패" + err);
        return res.send(errResponse(baseResponse.FAIL));
    }
}

exports.transferMatchingData = async function(req,res){

    const userUUID = req.cookies.uuid;
    const data = req.body;

    console.log(req.body);

    const path = `${Path}/${userUUID}/`;

    let user_kpt_path = path + "user_kpt_result.json";
    let answer_kpt_path = path + "answer_kpt_result.json";
    let user_mot_path = path + "user_mot_result.json";
    let answer_mot_path = path + "answer_mot_result.json";


    await axios.post("http://127.0.0.1:5000/scoring",{
        "user_kpt_result" : user_kpt_path,
        "answer_kpt_result" : answer_kpt_path,
        "user_mot_result" : user_mot_path,
        "answer_mot_result" : answer_mot_path,
        "matchingData" : data
    }).then(result => {
        console.log(result);
    })

}

