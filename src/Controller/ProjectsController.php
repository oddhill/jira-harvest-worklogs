<?php

namespace App\Controller;

use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use App\Service\HarvestService;

class ProjectsController extends AbstractController
{

  private $harvestService;

  public function __construct(HarvestService $harvest)
  {
    $this->harvestService = $harvest;
  }

  /**
   * @Route("/projects")
   */
  public function list()
  {
    $response = [];

    foreach ($this->getProjects() as $project) {
      $response[$project->client->name][] = [
        'id' => $project->id,
        'name' => $project->name,
      ];
    }

    return $this->json($response);
  }


  private function getProjects($parameters = [], array &$projects = []) {
    $response = $this->harvestService->getProjects($parameters);
    $projects = array_merge($projects, $response->projects);

    if ($response->next_page) {
      $parameters['page'] = $response->page + 1;
      $this->getProjects($parameters, $projects);
    }

    return $projects;
  }

}