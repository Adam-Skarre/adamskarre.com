import {calculate} from './model.mjs';
import {caseLink} from './workspace.mjs';
const slider=document.querySelector('#finance-entry');
if(slider){
  const render=()=>{
    const entryMultiple=Number(slider.value),r=calculate({entryMultiple});
    document.querySelector('#finance-entry-value').textContent=entryMultiple.toFixed(1)+'×';
    document.querySelector('#finance-return').textContent=(r.irr*100).toFixed(1)+'%';
    document.querySelector('#finance-moic').textContent=r.moic.toFixed(2)+'×';
    document.querySelector('#finance-verdict').textContent=r.irr>=.20?'Clears the 20% return hurdle':'Below the 20% return hurdle';
    document.querySelector('#finance-open').href=caseLink({entryMultiple},new URL('finance/',location.href));
  };
  slider.addEventListener('input',render);render();
}
