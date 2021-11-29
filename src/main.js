
import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from "bignumber.js"
import marketplaceAbi from '../contract/influencermarketplace.abi.json'
import erc20Abi from "../contract/erc20.abi.json"

const ERC20_DECIMALS = 18
const MPContractAddress = "0x3b50D063e015F555140be07E224e4bD8A13A81aE"
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"

let kit;
let contract;
let influencers = [];


const connectCeloWallet = async function () {
    if (window.celo) {
      try {
        notification("⚠️ Please approve this DApp to use it.")
        await window.celo.enable()
        notificationOff()
        const web3 = new Web3(window.celo)
        kit = newKitFromWeb3(web3)
  
        const accounts = await kit.web3.eth.getAccounts()
        kit.defaultAccount = accounts[0]
  
        contract = new kit.web3.eth.Contract(marketplaceAbi, MPContractAddress)
      } catch (error) {
        notification(`⚠️ ${error}.`)
      }
    } else {
      notification("⚠️ Please install the CeloExtensionWallet.")
    }
  }

  async function approve(_price) {
    const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)
    const result = await cUSDContract.methods
      .approve(MPContractAddress, _price)
      .send({ from: kit.defaultAccount })
    return result
  }

  const getBalance = async function () {
    const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
    const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
    document.querySelector("#balance").textContent = cUSDBalance
  }

  document.querySelector("#newInfluencerBtn").addEventListener("click", async (e) => {
    const params = [
        document.getElementById("newInfluencerName").value,
        document.getElementById("newImgUrl").value,
        document.getElementById("newAudienceDescription").value,
        document.getElementById("newEmail").value,
        new BigNumber(document.getElementById("newPrice").value)
        .shiftedBy(ERC20_DECIMALS)
        .toString()
      ];
      notification(`⌛ Adding "${params[0]}"...`)
    try {
      const result = await contract.methods.writeInfluencerinfo(...params)
        .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`🎉 You successfully added "${params[0]}".`)
    getInfluencers()
  })

  const getInfluencers = async function() {
    const _influencersLength = await contract.methods.getInfluencersLength().call()
    const _influencers = []

    for (let i = 0; i < _influencersLength; i++) {
        let _influencer = new Promise(async (resolve, reject) => {
          let inf = await contract.methods.readInfluencerinfo(i).call()
          resolve({
            index: i,
            owner: inf[0],
            name: inf[1],
            image: inf[2],
            description: inf[3],
            email: inf[4],
            price: new BigNumber(inf[5]),
          });
        });
        _influencers.push(_influencer);
      }
      influencers = await Promise.all(_influencers);
      renderInfluencers();
    };


  function renderInfluencers() {
    document.getElementById("marketplace").innerHTML = ""
    influencers.forEach((_influencer) => {
      const newDiv = document.createElement("div");
      newDiv.className = "col-md-4";
      newDiv.innerHTML = `
            ${influencerTemplate(_influencer)}   <div class="imageTemplates"></div>`;
      document.getElementById("marketplace").appendChild(newDiv)
    });
  }


  // function to only show the email address of the influencer when payed is true which is when the payment has been confirmed as seen on the smart contract.
const showEmail = async function (){
  const influencerEmail = await contract.methods.getInfluencerEmail(_influencer.index).call();
  return influencerEmail
  
}

  function influencerTemplate(_influencer) {
    return `
      <div class="card mb-4 mx-2 imageTemplate">
        <img class="card-img-top" src="${_influencer.image}" alt="...">
        <div class="card-body text-left p-4 position-relative">
        <div class="translate-middle-y position-absolute top-0">
        ${identiconTemplate(_influencer.owner)}
        </div>
        <h2 class="card-title fs-4 fw-bold mt-2">${_influencer.name}</h2>
        <p class="card-text mb-4" style="min-height: 82px">
          ${_influencer.description}             
        </p>
        <p class="card-text mt-4">
          <i class="bi bi-envelope-fill"></i>
          <span>${showEmail()}</span>
        </p>
        <div class="d-grid gap-2">
          <a class="btn btn-lg btn-outline-dark buyBtn fs-6 p-3" id=${
            _influencer.index
          }>
            Buy promotion for ${_product.price.shiftedBy(-ERC20_DECIMALS).toFixed(2)} cUSD
          </a>
        </div>
      </div>
    </div>
  `
}

function identiconTemplate(_address) {
    const icon = blockies
      .create({
        seed: _address,
        size: 8,
        scale: 16,
      })
      .toDataURL()
  
    return `
    <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
      <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
          target="_blank">
          <img src="${icon}" width="48" alt="${_address}">
      </a>
    </div>
    `
  }

  function notification(_text) {
    document.querySelector(".alert").style.display = "block"
    document.querySelector("#notification").textContent = _text
  }
  
  function notificationOff() {
    document.querySelector(".alert").style.display = "none"
  }

  


  


  document.querySelector("#marketplace").addEventListener("click", async(e) => {
    if(e.target.className.includes("buyBtn")) {
      const index = e.target.id
      notification("⌛ Waiting for payment approval...")
      try {
        await approve(influencers[index].price)
      } catch (error) {
        notification(`⚠️ ${error}.`)
      }
      notification(`⌛ Awaiting payment for "${influencers[index].name}"...`)
      try {
        const result = await contract.methods
          .payforInfluencer(index)
          .send({ from: kit.defaultAccount })
      notification(`🎉 You successfully bought a promotion from "${influencers[index].name}".`)
      getInfluencers()
      getBalance()
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  }
})  

window.addEventListener("load", async() => {
  notification("⌛ Loading...");
  await connectCeloWallet();
  await getBalance();
  await getInfluencers();
  notificationOff();
});
