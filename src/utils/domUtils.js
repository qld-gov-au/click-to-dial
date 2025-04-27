/* -----------------------------------------------------------------------------
  Setup div for Agent Messages
----------------------------------------------------------------------------- */

export function initDivs() {

  let newGenEnv = document.createElement("div");
  newGenEnv.className="container_gen_msg";
  newGenEnv.id="gen_msg";
  newGenEnv.innerHTML="unknown organization";
  document.body.append(newGenEnv);

  let newDivResult = document.createElement("div");
  newDivResult.className="container_csa_msg";
  newDivResult.id="csa_msg";
  newDivResult.innerHTML=``

  document.body.append(newDivResult);

  console.log("ctd_pwajs::initGetCTDTypeDiv() agent(CSA) message div created");

}

/* -----------------------------------------------------------------------------
  Display result of consult actions or error mesages to agent
----------------------------------------------------------------------------- */

export function putCTDmsg(msg,timeout,justMsg) {
  if (justMsg) {

    document.getElementById("csa_msg").innerHTML=
      `<div class="tel_pwa_msg">${msg}<br><br></div>`

  } else {

    document.getElementById("csa_msg").innerHTML=
      `<div class="tel_pwa_msg">${msg}<br><br>`
  }

  document.getElementById("csa_msg").style.display = "flex";
}

export function displayMessage(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) element.innerHTML = message;
}

