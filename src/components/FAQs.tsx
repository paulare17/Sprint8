import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

export default function FAQs() {
  return (
    <div className="faqs-accordeon">
      <Accordion>
        <AccordionSummary
          expandIcon={<ArrowDropDownIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
        >
          <Typography component="span">Com creo una llista nova?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Vés a l'apartat "Llistes": allà trobaràs les opcions "Crea una nova
            llista" o "Uneix-te a una llista". Fes click a "Crea una nova
            llista" i dona-li un nom i, sobretot: un codi postal!
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary
          expandIcon={<ArrowDropDownIcon />}
          aria-controls="panel2-content"
          id="panel2-header"
        >
          <Typography component="span">
            Puc compartir la llista amb altres usuaris?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Sí! Quan hagis creat la llista, veuràs que té un ID al costat del
            nom. Comparteix aquest ID amb les persones que vulguis compartir la
            llista.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary
          expandIcon={<ArrowDropDownIcon />}
          aria-controls="panel3-content"
          id="panel3-header"
        >
          <Typography component="span">
            Com m'uneixo a una llista ja existent?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Vés a l'apartat "Llistes". Allà escull la opció "Unir-se a una
            llista". Escriu l'ID aportat pel teu contacte, i ja ets dins! Pots
            afegir i treure productes i marcar-los com a comprats.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary
          expandIcon={<ArrowDropDownIcon />}
          aria-controls="panel4-content"
          id="panel4-header"
        >
          <Typography component="span">
            Com s'afegeixen els productes a una llista?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Un cop tinguis la llista seleccionada (important! sense seleccionar
            cap llista no pots accedir-hi), podras escriure el producte que
            vulguis. Després, selecciona el supermercat que desitgis (o cap
            supermercat!) i fes click al botó ➕ . Veuràs com s'afegeix el
            producte a la teva llista.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary
          expandIcon={<ArrowDropDownIcon />}
          aria-controls="panel5-content"
          id="panel5-header"
        >
          <Typography component="span">
            Com marco una compra que ja he fet?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Vés a l'apartat "Pendents". Si no tens una llista seleccionada,
            selecciona-la de les diferents llistes. Un cop seleccionada,
            t'apareixeran els diferents productes introduïts. Si ja l'has
            comprat, fes click al recuadre del producte. Veuràs que passa als
            "Productes comprats". Si t'has equivocat, simplement torna fer
            click!
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary
          expandIcon={<ArrowDropDownIcon />}
          aria-controls="panel6-content"
          id="panel6-header"
        >
          <Typography component="span">
            I si el que vull comprar no està a un supermercat de la llista o és
            un altre tipus de botiga?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Cap problema! Pots no especificar cap supermercat. A l'hora d'afegir
            productes, selecciona la opció "Sense supermercat específic"
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary
          expandIcon={<ArrowDropDownIcon />}
          aria-controls="panel7-content"
          id="panel7-header"
        >
          <Typography component="span">
            Com puc veure el mapa dels supermercats?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Vés a l'apartat "Mapa". Allà, espera uns segons: veuràs el teu barri
            amb els supermercats disponibles! Observaràs també que els
            supermercats estan marcats de dues maneres: 🏪 per als supermercats
            disponibles al teu barri però sense cap producte assignat, i 🛒 per
            als supermercats on sí tinguis productes assignats. Així és més
            fàcil marcar la teva ruta! També pots fer la llista seleccionant
            primer un supermercat i afegint els productes que vulguis comprar en
            aquest supermercat concret.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary
          expandIcon={<ArrowDropDownIcon />}
          aria-controls="panel8-content"
          id="panel8-header"
        >
          <Typography component="span">
            Com funcionen els recordatoris per comprar productes?
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            La majoria de nuclis familiars compren de manera recurrent els
            mateixos productes (un cop al mes s'acaba el paper de vàter), o
            tenen habits que repeteixen de manera setmanal o mensual (les
            clàssiques pizzes per sopar el dissabte). Per no estar constantment
            afegint productes repetits, es pot programar que cada cert temps
            (setmanal, quinzenal, mensual o bimensual) els productes s'afegeixin
            de forma automàtica. Per a poder fer-ho, vés a l'apartat
            "Calendari".
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary
          expandIcon={<ArrowDropDownIcon />}
          aria-controls="panel9-content"
          id="panel9-header"
        >
          <Typography component="span">Què mostren els gràfics?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Els gràfics mostren qui ha afegit els usuaris i qui els ha comprat.
            Pot ser una eina per a regular i revisar la feina que fa cadascú a
            casa, o per a equilibrar l'aportació econòmica de cadascú. No ha de
            ser una eina per a discutir, si no per a organitzar-se de forma
            equitativa.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </div>
  );
}
