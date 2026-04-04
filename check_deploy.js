(async () => {
    try {
        console.log("Fetching game.js from Vercel...");
        const res = await fetch('https://run-and-ask.vercel.app/js/game.js?t=' + Date.now());
        const text = await res.text();
        const hasLegL = text.includes("legL: playerGroup.children.find(c => c.name === 'legL')");
        const hasObsMove = text.includes("obsMoveZ += obs.userData.typeData.moveSpeed * dt;");
        const isLegLUndefined = text.includes("legL: legL");
        
        console.log("Contains fixed legL logic:", hasLegL);
        console.log("Contains broken legL logic:", isLegLUndefined);
        console.log("Contains fixed train math:", hasObsMove);
    } catch(e) {
        console.error(e);
    }
})();
