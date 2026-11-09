import { pageMetadata } from '@/lib/site-content';
export const metadata = pageMetadata("/coa-library", "COA Library", "Check the availability of original batch-specific certificates of analysis and learn what a genuine laboratory report should document.", false);
import { FileText } from 'lucide-react';

export default function CoaLibrary(){return <section className="section research-index">
 <div className="breadcrumb">HOME / COA LIBRARY</div>
 <div className="library-heading"><span className="eyebrow">DOCUMENTATION / SVOLTA</span><h1>Original evidence.<br />Clear provenance.</h1><p>Batch-specific laboratory documents belong here when they are available and reviewed.</p></div>
 <div className="documentation-empty"><FileText size={34} strokeWidth={1.2}/><h2>Documentation is pending.</h2><p>No verified certificates of analysis have been published. Product illustrations and published literature are not analytical evidence for the material in this catalog.</p><a className="button outline" href="/contact/">Ask about documentation ↗</a></div>
 <div className="library-note"><span>01 / HOW TO READ A REPORT</span><p>A genuine COA should identify the tested batch and methods, with the original issuing laboratory document available for review. This site makes no unverified claims about purity, sterility, or testing relationships.</p></div>
 </section>;}
