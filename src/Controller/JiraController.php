<?php

namespace App\Controller;

use Symfony\Component\Routing\Annotation\Route;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;

class JiraController extends AbstractController
{

  /**
   * @Route("/jira-connect")
   */
  public function connect(LoggerInterface $logger)
  {
    $response = [
      'name' => 'JIRA Harvest worklogs',
      'description' => 'Imports entries from Harvest as worklogs to JIRA issues.',
      'key' => 'com.oddhill.jira_harvest_worklogs',
      'baseUrl' => $_ENV['JIRA_CONNECT_BASE_URL'],
      'vendor' => [
        'name' => 'Odd Hill',
        'url' => 'https://www.oddhill.se/',
      ],
      'authentication' => [
        'type' => 'jwt',
      ],
      'lifecycle' => [
        'installed' => '/jira-connect/installed',
      ],
      'scopes' => ['READ', 'WRITE', 'ACT_AS_USER'],
      'apiVersion' => 1,
      'modules' => [
        'generalPages' => [
          [
            'url' => '/main',
            'key' => 'harvest.worklogs.main',
            'location' => 'system.top.navigation.bar',
            'name' => [
              'value' => 'Harvest worklogs',
            ],
          ]
        ]
      ],
    ];

    return $this->json($response);
  }

  /**
   * @Route("/jira-connect/installed")
   */
  public function installed(LoggerInterface $logger)
  {
    $logger->info('JIRA Connect installed: ' . file_get_contents('php://input'));

    return new Response();
  }

}