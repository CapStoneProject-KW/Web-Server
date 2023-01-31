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

let flag = false

exports.accessMainPage = async function(req,res){

  /** 사용자 최초 접속시 uuid 부여 **/
  const userUUID = uuid.v4();
  let path = `C:\\Users\\jknad\\WebstormProjects\\Web-Server\\userLog\\${userUUID}`
  console.log("사용자 접속 :" + userUUID);

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

  /** 부여된 uuid를 쿠키에서 가져옴 **/
  const userUUID = req.cookies.uuid;
  console.log(userUUID);


  /** 영상 파일의 최종 위치, 해당 위치를 인자로 넘겨주어 접근하면 됨 **/
  const path = `C:\\Users\\jknad\\WebstormProjects\\Web-Server\\userLog\\${userUUID}\\${userUUID}`+'youtube.mp4'

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
              // AI 서버 API : http://127.0.0.1:8000/ai/video
          let aiReturnResponse = await axios.post("http://127.0.0.1:8000/ai/video",{
                path : path
              }).then((result)=>{
                return result.data.message
              })


          /**                       --- 내용 ---
           Q) 영상 동시 Detection 혹은 먼저 오는 순서대로 ?
           동시 => 그냥 비동기로 영상 받고 끝 (어차피 영상 녹화되는 시간 안에 다운받아짐 아마)
           각각 => 응답 결과를 어디에 저장했다가 녹화까지 끝나고 한꺼번에 다른 API로 전송

           => detection 은 시간 얼마 안걸림(약 몇초)
           => AI 모델은 영상을 동시에 처리하지 않고 하나씩 순차적으로 처리한다.
           => 매칭된 정보는 나중에 모든 영상에 대해 KeyPoint, Tracking 처리를 다하고 사용되어도 상관없음


           **/

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

        const mp4Path = `uploads/${Date.now()}.mp4`;
        const tempPath =
            "C:/Users/user/Desktop/Programming/Last Dance/Web-Server/uploads/1674012392009.mp4";

        axios
            .post(
                "http://127.0.0.1:5000/detection",
                {
                    videoPath: tempPath,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            )
            .then((res) => {
                console.log(res.data);
            });

        return res.send(response(baseResponse.SUCCESS("완료되었습니다.")));
    } catch (err) {
        logger.warn("응답 실패" + err);
        return res.send(errResponse(baseResponse.FAIL));
    }
}