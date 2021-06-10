const express = require("express");
const router = express.Router();
const IPFS = require("ipfs-mini");
const fetch = require("node-fetch");
const web3 = require("web3");
const ipfs = new IPFS({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
});

const CryptoJS = require("crypto-js");

const encryptWithAES = (text, secret) => {
  return CryptoJS.AES.encrypt(text, secret).toString();
};

//Add beneficiary post req
const secret = "identify@capstone";
router.post("/", (req, res, next) => {
  const data = req.body;
  if (
    !data.id ||
    data.id < 0 ||
    data.id.toString().length != 12 ||
    !data.distnId ||
    data.distnId < 0 ||
    !data.credentials.image ||
    !data.approvalStatus ||
    !(
      data.approvalStatus == 1 ||
      data.approvalStatus == 2 ||
      data.approvalStatus == 3
    )
  ) {
    res.status(400).send("Bad Request");
    return;
  }

  ipfs.add(JSON.stringify(data.credentials), (err, hash) => {
    if (err) {
      res.status(500).send("server error");
      return;
    }
    const encCredentials = encryptWithAES(hash, secret);
    const responseData = {
      id: data.id,
      distnId: data.distnId,
      credentials: encCredentials,
      approvalStatus: data.approvalStatus,
    };
    res.status(200).send({
      ...responseData,
      token: web3.utils.soliditySha3(
        { type: "uint", value: data.id },
        { type: "uint", value: data.distnId },
        { type: "string", value: encCredentials },
        { type: "uint", value: data.approvalStatus },
        { type: "string", value: secret }
      ),
    });
  });

  // fetch("https://face-verification2.p.rapidapi.com/faceverification", {
  //   method: "POST",
  //   headers: {
  //     "content-type": "application/x-www-form-urlencoded",
  //     "x-rapidapi-key": "3d15874e0amshf1bdb48a55c5499p100e08jsn9ee781838fa3",
  //     "x-rapidapi-host": "face-verification2.p.rapidapi.com",
  //   },
  //   body: new URLSearchParams({
  //     image1Base64: req.body.img,
  //     image2Base64: req.body.img,
  //   }),
  // })
  //   .then((resp) => resp.json())
  //   .then((json) => res.send(json))
  //   .catch((err) => console.log(err));
});

module.exports = router;
