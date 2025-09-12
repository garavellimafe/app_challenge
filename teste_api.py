import requests
import json

url = "http://localhost:3080/api/assistente"
data = {
    "mensagem": "adicione o DNS-G3",
    "itens": [],
    "itens_disponiveis": ["DNS-G3", "DNS-G4", "XS-G3", "MS-G3", "MS-G4"]
}

try:
    response = requests.post(url, json=data)
    print("Status:", response.status_code)
    print("Response:", response.json())
except Exception as e:
    print("Erro:", e)