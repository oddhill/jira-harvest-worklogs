<?php

namespace App\Service;

use Symfony\Component\Dotenv\Dotenv;
use Symfony\Component\HttpClient\HttpClient;

class HarvestService
{

  protected $client;

  public function __construct()
  {
    $this->client = HttpClient::create([
      'headers' => [
        'Authorization' => "Bearer {$_ENV['HARVEST_TOKEN']}",
        'Harvest-Account-Id' => $_ENV['HARVEST_ACCOUNT_ID'],
      ],
      'http_version' => '1.1'
    ]);
  }

  public function getProjects(array $parameters = [])
  {
    $parameters += [
      'is_active' => 'true',
      'page' => 1,
      'per_page' => 100,
    ];

    $response = $this->client->request('GET', 'https://api.harvestapp.com/v2/projects', [
      'query' => $parameters,
    ]);

    return json_decode($response->getContent());
  }

  public function getTimeEntries(array $parameters = [])
  {
    $parameters += [
      'page' => 1,
      'per_page' => 100,
    ];

    $response = $this->client->request('GET', 'https://api.harvestapp.com/v2/time_entries', [
      'query' => $parameters,
    ]);

    return json_decode($response->getContent());
  }
}
