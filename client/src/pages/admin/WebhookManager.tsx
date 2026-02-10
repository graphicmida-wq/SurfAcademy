import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw, Send, Activity, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface WebhookLog {
  id: string;
  orderId: number;
  orderStatus: string;
  customerEmail: string;
  productIds: string[];
  processed: boolean;
  error: string | null;
  createdAt: string;
}

interface DiagnosticStep {
  step: string;
  status: string;
  count?: number;
  courses?: { id: string; title: string }[];
  mappings?: any[];
  fallbackResults?: any[];
  recent?: any[];
  courseIds?: string[];
  error?: string;
}

interface DiagnosticResult {
  timestamp: string;
  environment: string;
  webhookSecretConfigured: boolean;
  steps: DiagnosticStep[];
}

export default function WebhookManager() {
  const [simEmail, setSimEmail] = useState("");
  const [simFirstName, setSimFirstName] = useState("");
  const [simLastName, setSimLastName] = useState("");
  const [simWpUserId, setSimWpUserId] = useState("");
  const [simProductIds, setSimProductIds] = useState("1216");
  const [simResult, setSimResult] = useState<any>(null);
  const { toast } = useToast();

  const { data: diagnostic, isLoading: diagLoading, refetch: refetchDiag } = useQuery<DiagnosticResult>({
    queryKey: ["/api/admin/webhook-diagnostic"],
  });

  const { data: webhookLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery<WebhookLog[]>({
    queryKey: ["/api/admin/webhook-logs"],
  });

  const simulateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/webhook-simulate", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setSimResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/webhook-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/webhook-diagnostic"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/enrollments"] });
      if (data.success) {
        toast({ title: `Iscrizione creata per ${data.userId}` });
      } else {
        toast({ title: "Nessun corso trovato", variant: "destructive" });
      }
    },
    onError: (err: any) => {
      toast({ title: "Errore simulazione", description: err.message, variant: "destructive" });
    },
  });

  const handleSimulate = () => {
    if (!simEmail) {
      toast({ title: "Email obbligatoria", variant: "destructive" });
      return;
    }
    const productIdArray = simProductIds.split(",").map(s => s.trim()).filter(Boolean);
    simulateMutation.mutate({
      email: simEmail,
      firstName: simFirstName || undefined,
      lastName: simLastName || undefined,
      wpUserId: simWpUserId || undefined,
      productIds: productIdArray,
    });
  };

  const getStatusIcon = (status: string) => {
    if (status === "ok") return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === "ERROR" || status === "FAILED") return <XCircle className="w-4 h-4 text-red-500" />;
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <div className="space-y-6" data-testid="webhook-manager">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Webhook WooCommerce</h1>
        <Button
          variant="outline"
          onClick={() => { refetchDiag(); refetchLogs(); }}
          data-testid="button-refresh-all"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Aggiorna
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Diagnostica Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          {diagLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Controllo in corso...</span>
            </div>
          ) : diagnostic ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4 flex-wrap text-sm">
                <span>Ambiente: <Badge variant="secondary">{diagnostic.environment}</Badge></span>
                <span>
                  Firma HMAC:{" "}
                  {diagnostic.webhookSecretConfigured ? (
                    <Badge>Configurata</Badge>
                  ) : (
                    <Badge variant="destructive">Non configurata</Badge>
                  )}
                </span>
              </div>
              <div className="space-y-2">
                {diagnostic.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50">
                    {getStatusIcon(step.status)}
                    <span className="font-medium">{step.step}</span>
                    {step.count !== undefined && (
                      <Badge variant="secondary">{step.count}</Badge>
                    )}
                    {step.status === "ERROR" && (
                      <span className="text-destructive text-xs">{step.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Impossibile caricare la diagnostica</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Simula Webhook (Iscrizione Manuale via Prodotto)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Simula un acquisto WooCommerce senza verifica firma. Crea utente e iscrizione automaticamente.
            Product IDs: 1216=REMATA, 1231=TAKEOFF, 1243=NOSERIDE
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                value={simEmail}
                onChange={(e) => setSimEmail(e.target.value)}
                placeholder="studente@email.com"
                data-testid="input-sim-email"
              />
            </div>
            <div className="space-y-2">
              <Label>WordPress User ID</Label>
              <Input
                value={simWpUserId}
                onChange={(e) => setSimWpUserId(e.target.value)}
                placeholder="es. 42"
                data-testid="input-sim-wpid"
              />
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={simFirstName}
                onChange={(e) => setSimFirstName(e.target.value)}
                placeholder="Mario"
                data-testid="input-sim-firstname"
              />
            </div>
            <div className="space-y-2">
              <Label>Cognome</Label>
              <Input
                value={simLastName}
                onChange={(e) => setSimLastName(e.target.value)}
                placeholder="Rossi"
                data-testid="input-sim-lastname"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Product IDs (separati da virgola)</Label>
              <Input
                value={simProductIds}
                onChange={(e) => setSimProductIds(e.target.value)}
                placeholder="1216,1231"
                data-testid="input-sim-products"
              />
            </div>
          </div>
          <Button
            onClick={handleSimulate}
            disabled={simulateMutation.isPending}
            data-testid="button-simulate"
          >
            {simulateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Simula Acquisto
          </Button>

          {simResult && (
            <div className="mt-4 p-4 rounded-md bg-muted text-sm">
              <pre className="whitespace-pre-wrap overflow-x-auto" data-testid="text-sim-result">
                {JSON.stringify(simResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="w-5 h-5" />
            Ultimi Webhook Ricevuti
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Caricamento log...</span>
            </div>
          ) : webhookLogs && webhookLogs.length > 0 ? (
            <div className="space-y-2">
              {webhookLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-md bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {log.processed ? (
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                      <span className="font-medium">Ordine #{log.orderId}</span>
                      <Badge variant="secondary">{log.orderStatus}</Badge>
                      <span className="text-muted-foreground">{log.customerEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        Prodotti: {log.productIds?.join(", ")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString("it-IT")}
                      </span>
                    </div>
                  </div>
                  {log.error && (
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-background p-2 rounded overflow-x-auto" data-testid={`text-log-detail-${log.id}`}>
                      {log.error}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nessun webhook ricevuto ancora</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
