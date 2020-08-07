<?php

namespace App\Controller;

use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use App\Service\HarvestService;

class TimesheetsController extends AbstractController
{

  private $harvestService;

  public function __construct(HarvestService $harvest)
  {
    $this->harvestService = $harvest;
  }

  /**
   * @Route("/time-entries")
   */
  public function list(Request $request)
  {
    $response = [];

    $parameters = [
      'project_id' => $request->query->get('project'),
      'from' => $request->query->get('from'),
      'to' => $request->query->get('to'),
    ];

    foreach ($this->getTimeEntries($parameters) as $entry) {
      $matches = [];
      preg_match('/[A-Z]+-[0-9]+/ui', $entry->notes, $matches);

      if (isset($matches[0]) && !$entry->is_running) {
        $response[$matches[0]][] = [
          'id' => $entry->id,
          'date' => date('Y-m-d\TH:i:s.000O', strtotime($entry->spent_date)),
          'seconds' => $entry->hours * (60 * 60),
          'notes' => $entry->notes,
          'user' => $entry->user->name,
        ];
      }
    }

    return $this->json($response);
  }


  private function getTimeEntries($parameters = [], array &$entries = []) {
    $response = $this->harvestService->getTimeEntries($parameters);
    $entries = array_merge($entries, $response->time_entries);

    if ($response->next_page) {
      $parameters['page'] = $response->page + 1;
      $this->getTimeEntries($parameters, $entries);
    }

    return $entries;
  }

}