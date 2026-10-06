const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

const anchorMap = `{
        "USA": { ticker: "AAPL", index: "S&P 500" },
        "CHN": { ticker: "TCEHY", index: "Shanghai Composite" },
        "JPN": { ticker: "7203.T", index: "Nikkei 225" },
        "DEU": { ticker: "SAP", index: "DAX 40" },
        "IND": { ticker: "RELIANCE.NS", index: "Nifty 50" },
        "GBR": { ticker: "SHEL.L", index: "FTSE 100" },
        "FRA": { ticker: "MC.PA", index: "CAC 40" },
        "ITA": { ticker: "ENEL.MI", index: "FTSE MIB" },
        "BRA": { ticker: "PETR4.SA", index: "IBOVESPA" },
        "CAN": { ticker: "RY.TO", index: "TSX" },
        "KOR": { ticker: "005930.KS", index: "KOSPI" },
        "ESP": { ticker: "ITX.MC", index: "IBEX 35" },
        "AUS": { ticker: "BHP.AX", index: "ASX 200" },
        "MEX": { ticker: "WALMEX.MX", index: "IPC" },
        "IDN": { ticker: "BBCA.JK", index: "JCI" },
        "NLD": { ticker: "ASML.AS", index: "AEX" },
        "SAU": { ticker: "2222.SR", index: "TASI" },
        "TUR": { ticker: "KCHOL.IS", index: "BIST 100" },
        "CHE": { ticker: "NESN.SW", index: "SMI" },
        "TWN": { ticker: "2330.TW", index: "TAIEX" },
        "POL": { ticker: "PKN.WA", index: "WIG20" },
        "ARG": { ticker: "YPFD.BA", index: "MERVAL" },
        "SWE": { ticker: "ATCO-A.ST", index: "OMXS30" },
        "BEL": { ticker: "ABI.BR", index: "BEL 20" },
        "THA": { ticker: "PTT.BK", index: "SET" },
        "NOR": { ticker: "EQNR.OL", index: "OBX" },
        "ARE": { ticker: "IHC.AD", index: "ADX" },
        "NGA": { ticker: "DANGCEM.LG", index: "NGX" },
        "ISR": { ticker: "NICE.TA", index: "TA-35" },
        "ZAF": { ticker: "NPN.JO", index: "JSE" },
        "DNK": { ticker: "NOVO-B.CO", index: "OMXC20" },
        "SGP": { ticker: "D05.SI", index: "STI" },
        "MYS": { ticker: "1155.KL", index: "KLCI" },
        "COL": { ticker: "ECOPETROL.CB", index: "COLCAP" },
        "PHL": { ticker: "SM.PS", index: "PSEi" },
        "PAK": { ticker: "OGDC.KA", index: "KSE 100" },
        "CHL": { ticker: "SQM-B.SN", index: "IPSA" },
        "FIN": { ticker: "KNEBV.HE", index: "OMXH25" },
        "BGD": { ticker: "SQURPHARMA.BD", index: "DSEX" },
        "EGY": { ticker: "COMI.CA", index: "EGX 30" },
        "VNM": { ticker: "VCB.HM", index: "VN Index" },
        "PRT": { ticker: "EDP.LS", index: "PSI 20" },
        "CZE": { ticker: "CEZ.PR", index: "PX" },
        "ROU": { ticker: "SNP.RO", index: "BET" },
        "PER": { ticker: "BAP", index: "SPBVL" },
        "NZL": { ticker: "FPH.NZ", index: "NZX 50" },
        "GRC": { ticker: "EUROB.AT", index: "ATHEX" },
        "QAT": { ticker: "QNBK.QA", index: "QE Index" },
        "KAZ": { ticker: "HSBK.IL", index: "KASE" },
        "HUN": { ticker: "OTP.BD", index: "BUX" },
        "KWT": { ticker: "NBK.KW", index: "Premier Market" },
        "MAR": { ticker: "ATW.CS", index: "MASI" },
        "KEN": { ticker: "SCOM.KE", index: "NSE 20" }
    }`;

server = server.replace(/corporateAnchorMap: Record<string, {ticker: string, index: string}> = \{[\s\S]*?\};/, "corporateAnchorMap: Record<string, {ticker: string, index: string}> = " + anchorMap + ";");

const mappingReplace = `const mapping = this.corporateAnchorMap[iso] || { ticker: iso + "-DOM", index: country.country_name + " National Index" };
            const ticker = mapping.ticker;`;

server = server.replace(/const mapping = this\.corporateAnchorMap\[iso\] \|\| \{ ticker: "AAPL", index: "Global Proxy Basket" \};\s*const ticker = mapping\.ticker;/, mappingReplace);

const fallbackReplace = `country.corporate_anchor_profile.company_name = country.country_name + " National Enterprise";
                    country.corporate_anchor_profile.equity_fundamentals = { 
                        market_cap_usd: country.central_bank_metrics.gdp_nominal_usd * (0.05 + Math.random() * 0.1),
                        trailing_pe: Math.round((12.5 + (Math.random() * 10)) * 10) / 10,
                        forward_pe: Math.round((11.0 + (Math.random() * 8)) * 10) / 10
                    };`;

server = server.replace(/country\.corporate_anchor_profile\.company_name = "Sovereign Enterprise";\s*country\.corporate_anchor_profile\.equity_fundamentals = \{\s*market_cap_usd: country\.central_bank_metrics\.gdp_nominal_usd \* 0\.05,\s*trailing_pe: Math\.round\(\(12\.5 \+ \(Math\.random\(\) \* 10\)\) \* 10\) \/ 10,\s*forward_pe: Math\.round\(\(11\.0 \+ \(Math\.random\(\) \* 8\)\) \* 10\) \/ 10\s*\};/g, fallbackReplace);

fs.writeFileSync('server.ts', server);
