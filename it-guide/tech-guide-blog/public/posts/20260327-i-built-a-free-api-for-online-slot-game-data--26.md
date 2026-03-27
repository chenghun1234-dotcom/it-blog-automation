# I built a free API for online slot game data — 2,600+ slots

> 원본 출처: devto
> 발행 일시: 2026-03-27 15:28

I built a free, public JSON API that serves data for 2,600+ online slot games from 21 providers.                                 
                                                                                                                                   
  ## Why?                                                                                                                          
                                                                                                                                   
  
I run [slot.report](https://slot.report), a German slot review site. While building it, I realized there's no free, open source for structured slot data. Every existing database is either paywalled, requires B2B contracts, or locked behind Cloudflare.
                                                                                                                                   
So I built one. 

  ## What data?

  Every slot has:                                                                                                                  
  - **RTP** (Return to Player) — 100% coverage
  - **Volatility** (low → extreme) — 100% coverage                                                                                 
  - **Max Win** multiplier — 100% coverage
  - Grid, release date, hit frequency, provider                                                                             
  
Providers include Pragmatic Play, Play'n GO, NetEnt, Nolimit City, Hacksaw Gaming, BGaming, Red Tiger, ELK Studios, and 13 more. 
                  
  ## How to use                                                                                                                    
                  
Endpoints return JSON. No API key, no auth, no signup.                                                                       
  
  **Get all slots:**                                                                                                               
  ```bash         
  curl https://slot.report/api/v1/slots.json

  Get a single slot:
  curl https://slot.report/api/v1/slots/gates-of-olympus.json

  Filter by provider:                                                                                                              
  curl https://slot.report/api/v1/providers/pragmatic-play.json
                                                                                                                                   
  Quick example in JavaScript:                                                                                                     
  const res = await fetch('https://slot.report/api/v1/slots.json');
  const { results } = await res.json();                                                                                            
                                                                                                                                   
  const highVolatile = results.filter(s =>
    s.volatility === 'extreme' && s.max_win >= 10000                                                                               
  );              
  console.log(`${highVolatile.length} extreme slots found`);                                                                       
                  
  API Docs                                                                                                                         
                  
Full documentation with all endpoints, data fields, and code examples:                                                           
   
  https://slot.report/api/                                                                                                         
                  
  Tech stack                                                                                                                       
                  
  - Static JSON files served by nginx                                                                                              
  - Data collected from official provider websites
  - Updated weekly                                                                                                                 
  - CORS enabled, no rate limits for normal use                                                                                    
   
Free to use. If you build something with it, I'd love to hear about it.
